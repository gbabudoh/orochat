'use server';

import { db } from '@/lib/db';
import type { Booking } from '@prisma/client';
import { computeBookingSplit } from '@/lib/stripe';
import { StripeService } from '@/services/stripe.service';
import { startCall, sendMessage } from '@/features/collab/actions';
import { triggerNotification } from '@/lib/novu';

const ALLOWED_CALL_DURATIONS_SECONDS = [900, 1800, 2700, 3600]; // 15/30/45/60 min, same as features/collab/actions.ts
const NO_SHOW_GRACE_SECONDS = 600; // 10 min after scheduledFor before "Report no-show" is allowed
const ORO_RESPONSE_WINDOW_SECONDS = 86400; // 24h for the Oro to respond to a no-show report before auto-refund

// ---------------------------------------------------------------------------
// Consult settings (Oro-facing)
// ---------------------------------------------------------------------------

export async function setConsultSettings(
  userId: string,
  input: {
    enabled: boolean;
    priceCents?: number;
    durations?: number[];
    topic?: string;
    description?: string;
    outcomes?: string;
  }
) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { stripeConnectOnboarded: true },
    });
    if (!user) return { error: 'User not found' };

    if (input.enabled && !user.stripeConnectOnboarded) {
      return { error: 'Finish payout setup before accepting paid consults' };
    }

    if (input.enabled) {
      if (!input.priceCents || input.priceCents <= 0) {
        return { error: 'Set a price greater than $0' };
      }
      if (!input.durations || input.durations.length === 0) {
        return { error: 'Pick at least one call duration' };
      }
      const invalid = input.durations.some((d) => !ALLOWED_CALL_DURATIONS_SECONDS.includes(d));
      if (invalid) return { error: 'Invalid call duration' };
      if (!input.topic || !input.topic.trim()) {
        return { error: "Describe what this consult is for" };
      }
    }

    await db.user.update({
      where: { id: userId },
      data: {
        consultEnabled: input.enabled,
        ...(input.priceCents !== undefined ? { consultPriceCents: input.priceCents } : {}),
        ...(input.durations !== undefined ? { consultDurations: input.durations } : {}),
        ...(input.topic !== undefined ? { consultTopic: input.topic.trim() } : {}),
        ...(input.description !== undefined ? { consultDescription: input.description.trim() || null } : {}),
        ...(input.outcomes !== undefined ? { consultOutcomes: input.outcomes.trim() || null } : {}),
      },
    });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to update consult settings' };
  }
}

// ---------------------------------------------------------------------------
// Availability slots (Oro-facing)
// ---------------------------------------------------------------------------

export async function addAvailabilitySlot(oroId: string, startAt: Date, durationSeconds: number) {
  try {
    if (!ALLOWED_CALL_DURATIONS_SECONDS.includes(durationSeconds)) {
      return { error: 'Invalid call duration' };
    }
    if (startAt.getTime() <= Date.now()) {
      return { error: 'Slot must be in the future' };
    }

    const slot = await db.availabilitySlot.create({
      data: { oroId, startAt, durationSeconds },
    });

    return { success: true, slot };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to add availability slot' };
  }
}

export async function removeAvailabilitySlot(slotId: string, oroId: string) {
  try {
    const slot = await db.availabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot) return { error: 'Slot not found' };
    if (slot.oroId !== oroId) return { error: 'Not your slot' };
    if (slot.isBooked) return { error: 'Cannot remove a booked slot' };

    await db.availabilitySlot.delete({ where: { id: slotId } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to remove availability slot' };
  }
}

/** Upcoming slots for an Oro. `onlyOpen` restricts to unbooked future slots (for the public profile picker). */
export async function getAvailabilitySlots(oroId: string, onlyOpen: boolean) {
  return db.availabilitySlot.findMany({
    where: {
      oroId,
      startAt: { gt: new Date() },
      ...(onlyOpen ? { isBooked: false } : {}),
    },
    orderBy: { startAt: 'asc' },
  });
}

// ---------------------------------------------------------------------------
// Booking creation + payment
// ---------------------------------------------------------------------------

export async function createBookingIntent(customerId: string, slotId: string) {
  try {
    const slot = await db.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { oro: { select: { id: true, consultEnabled: true, consultPriceCents: true, stripeConnectOnboarded: true } } },
    });
    if (!slot) return { error: 'Slot not found' };
    if (slot.isBooked) return { error: 'This slot has already been booked' };
    if (slot.startAt.getTime() <= Date.now()) return { error: 'This slot is no longer available' };
    if (slot.oroId === customerId) return { error: 'You cannot book your own consult' };
    if (!slot.oro.consultEnabled || !slot.oro.stripeConnectOnboarded || !slot.oro.consultPriceCents) {
      return { error: 'This Oro is not currently accepting bookings' };
    }

    const split = computeBookingSplit(slot.oro.consultPriceCents);

    // Reserve the slot immediately so it can't be double-booked while payment is in flight.
    const booking = await db.$transaction(async (tx) => {
      const claimed = await tx.availabilitySlot.updateMany({
        where: { id: slotId, isBooked: false },
        data: { isBooked: true },
      });
      if (claimed.count === 0) throw new Error('This slot has already been booked');

      return tx.booking.create({
        data: {
          customerId,
          oroId: slot.oroId,
          availabilitySlotId: slot.id,
          scheduledFor: slot.startAt,
          durationSeconds: slot.durationSeconds,
          priceCents: slot.oro.consultPriceCents!,
          estimatedStripeFeeCents: split.stripeFeeCents,
          oroAmountCents: split.oroAmountCents,
          applicationFeeAmountCents: split.applicationFeeAmountCents,
        },
      });
    });

    const charge = await StripeService.chargeSingleBooking(booking.id);
    if (!charge.success || !charge.clientSecret) {
      // Release the slot — payment setup failed before any money moved.
      await db.availabilitySlot.update({ where: { id: slotId }, data: { isBooked: false } });
      await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
      return { error: charge.reason || 'Failed to start payment' };
    }

    return { success: true, bookingId: booking.id, clientSecret: charge.clientSecret };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to create booking' };
  }
}

/** Polled by the client after stripe.confirmPayment() — the real state change happens via webhook. */
export async function getBookingStatus(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: 'Booking not found' };
  if (booking.customerId !== userId && booking.oroId !== userId) return { error: 'Not your booking' };

  return { success: true, booking };
}

/** Webhook-only — not user-callable. Idempotent against webhook redelivery. */
export async function activateBookingAfterPayment(bookingId: string, stripeChargeId: string | null) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: 'Booking not found' };
  if (booking.status !== 'PENDING_PAYMENT') return { success: true }; // already activated

  const conversation = await db.conversation.create({
    data: {
      isGroup: false,
      participants: { create: [{ userId: booking.customerId }, { userId: booking.oroId }] },
    },
  });

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: 'SCHEDULED',
      conversationId: conversation.id,
      stripeChargeId: stripeChargeId ?? undefined,
    },
  });

  const formData = new FormData();
  formData.append('conversationId', conversation.id);
  formData.append(
    'content',
    `Consult booked and confirmed for ${booking.scheduledFor.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}. The call will open here at that time.`
  );
  await sendMessage(booking.oroId, formData);

  await triggerNotification('booking-confirmed', booking.customerId, {
    message: 'Your consult booking is confirmed',
    type: 'booking_confirmed',
    conversationId: conversation.id,
  }, booking.oroId);

  return { success: true, conversationId: conversation.id };
}

// ---------------------------------------------------------------------------
// Call activation at the scheduled time
// ---------------------------------------------------------------------------

/**
 * Client-triggered, deadline-validated — same pattern as
 * enforceCallDurationCutoff in features/collab/actions.ts. Either party's
 * client can call this; it only actually starts the call once the real
 * scheduled time has passed.
 */
export async function activateScheduledCall(bookingId: string, userId: string) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.customerId !== userId && booking.oroId !== userId) return { error: 'Not your booking' };
    if (booking.callSessionId) return { success: true }; // already activated
    if (!['SCHEDULED', 'RESCHEDULE_ACCEPTED'].includes(booking.status)) {
      return { error: 'This booking is not ready to start' };
    }
    if (!booking.conversationId) return { error: 'Booking has no conversation yet' };

    const effectiveTime = booking.status === 'RESCHEDULE_ACCEPTED' ? booking.rescheduleProposedFor : booking.scheduledFor;
    if (!effectiveTime || Date.now() < effectiveTime.getTime()) {
      return { error: 'The scheduled time has not arrived yet' };
    }

    const call = await startCall(booking.conversationId, booking.oroId, booking.durationSeconds);
    if ('error' in call) return { error: call.error || 'Failed to start call' };

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: 'SCHEDULED',
        scheduledFor: effectiveTime,
        callSessionId: call.callSessionId,
      },
    });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to activate call' };
  }
}

/** Booking associated with a conversation, if any — powers the no-show/reschedule banner. */
export async function getBookingForConversation(
  conversationId: string,
  userId: string
): Promise<{ error: string } | { success: true; booking: Booking | null }> {
  const booking = await db.booking.findUnique({ where: { conversationId } });
  if (!booking) return { success: true, booking: null };
  if (booking.customerId !== userId && booking.oroId !== userId) return { error: 'Not your booking' };

  return { success: true, booking };
}

// ---------------------------------------------------------------------------
// No-show / reschedule / refund
// ---------------------------------------------------------------------------

export async function reportNoShow(bookingId: string, customerId: string) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.customerId !== customerId) return { error: 'Only the customer can report a no-show' };
    if (booking.status !== 'SCHEDULED') return { error: 'This booking is not in a reportable state' };

    const graceDeadline = booking.scheduledFor.getTime() + booking.durationSeconds * 1000 + NO_SHOW_GRACE_SECONDS * 1000;
    if (Date.now() < graceDeadline) return { error: 'Please wait a little longer before reporting a no-show' };

    await db.booking.update({
      where: { id: bookingId },
      data: { status: 'NO_SHOW_REPORTED', noShowReportedAt: new Date() },
    });

    await triggerNotification('booking-no-show-reported', booking.oroId, {
      message: 'A customer reported you missed a scheduled consult',
      type: 'booking_no_show',
      bookingId,
    }, booking.customerId);

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to report no-show' };
  }
}

/** The Oro's one allowed reschedule offer per no-show report. */
export async function proposeReschedule(bookingId: string, oroId: string, newTime: Date) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.oroId !== oroId) return { error: 'Only the Oro can propose a reschedule' };
    if (booking.status !== 'NO_SHOW_REPORTED') return { error: 'No no-show report is pending for this booking' };
    if (booking.rescheduleProposedAt) return { error: 'A reschedule has already been offered for this booking' };
    if (newTime.getTime() <= Date.now()) return { error: 'Proposed time must be in the future' };

    await db.booking.update({
      where: { id: bookingId },
      data: { status: 'RESCHEDULE_PROPOSED', rescheduleProposedAt: new Date(), rescheduleProposedFor: newTime },
    });

    await triggerNotification('booking-reschedule-proposed', booking.customerId, {
      message: 'The Oro proposed a new time for your consult',
      type: 'booking_reschedule_proposed',
      bookingId,
    }, oroId);

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to propose reschedule' };
  }
}

export async function respondToReschedule(bookingId: string, customerId: string, accept: boolean) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.customerId !== customerId) return { error: 'Only the customer can respond to a reschedule' };
    if (booking.status !== 'RESCHEDULE_PROPOSED') return { error: 'No reschedule offer is pending for this booking' };

    if (!accept) {
      return refundBooking(bookingId, 'Reschedule declined by customer');
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { status: 'RESCHEDULE_ACCEPTED' },
    });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to respond to reschedule' };
  }
}

/** Client-triggered, deadline-validated — auto-refunds if the Oro never responds to a no-show report. */
export async function expireNoShowWindow(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: 'Booking not found' };
  if (booking.customerId !== userId && booking.oroId !== userId) return { error: 'Not your booking' };
  if (booking.status !== 'NO_SHOW_REPORTED') return { error: 'No no-show report is pending for this booking' };
  if (!booking.noShowReportedAt) return { error: 'Missing no-show report timestamp' };

  const deadline = booking.noShowReportedAt.getTime() + ORO_RESPONSE_WINDOW_SECONDS * 1000;
  if (Date.now() < deadline) return { error: 'The response window has not expired yet' };

  return refundBooking(bookingId, 'Oro did not respond to the no-show report in time');
}

/** Internal — full refund reversing both sides of the Stripe split. Not exported as a form action. */
async function refundBooking(bookingId: string, reason: string) {
  const result = await StripeService.refundBooking(bookingId);
  if (!result.success) return { error: result.reason || 'Failed to process refund' };

  await db.booking.update({
    where: { id: bookingId },
    data: { status: 'REFUNDED', refundedAt: new Date(), refundReason: reason },
  });

  return { success: true };
}
