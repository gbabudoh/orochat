'use server';

import { db } from '@/lib/db';
import { computeBookingSplit } from '@/lib/stripe';
import { StripeService } from '@/services/stripe.service';
import { startCall, sendMessage } from '@/features/collab/actions';
import { triggerNotification } from '@/lib/novu';

const ALLOWED_CALL_DURATIONS_SECONDS = [900, 1800, 2700, 3600]; // 15/30/45/60 min, same as features/collab/actions.ts
const ALLOWED_CAPACITIES = [1, 5, 10, 20, 30, 40, 50]; // max attendees per slot; 1 = the original private 1:1 consult
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

export async function addAvailabilitySlot(oroId: string, startAt: Date, durationSeconds: number, capacity: number = 1) {
  try {
    if (!ALLOWED_CALL_DURATIONS_SECONDS.includes(durationSeconds)) {
      return { error: 'Invalid call duration' };
    }
    if (!ALLOWED_CAPACITIES.includes(capacity)) {
      return { error: 'Invalid capacity' };
    }
    if (startAt.getTime() <= Date.now()) {
      return { error: 'Slot must be in the future' };
    }

    const slot = await db.availabilitySlot.create({
      data: { oroId, startAt, durationSeconds, capacity },
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
    if (slot.bookedCount > 0) return { error: 'Cannot remove a slot with bookings' };

    await db.availabilitySlot.delete({ where: { id: slotId } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to remove availability slot' };
  }
}

/** Upcoming slots for an Oro. `onlyOpen` restricts to future slots with open seats (for the public profile picker). */
export async function getAvailabilitySlots(oroId: string, onlyOpen: boolean) {
  const slots = await db.availabilitySlot.findMany({
    where: { oroId, startAt: { gt: new Date() } },
    orderBy: { startAt: 'asc' },
  });
  return onlyOpen ? slots.filter((s) => s.bookedCount < s.capacity) : slots;
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
    if (slot.bookedCount >= slot.capacity) return { error: 'This slot is already fully booked' };
    if (slot.startAt.getTime() <= Date.now()) return { error: 'This slot is no longer available' };
    if (slot.oroId === customerId) return { error: 'You cannot book your own consult' };
    if (!slot.oro.consultEnabled || !slot.oro.stripeConnectOnboarded || !slot.oro.consultPriceCents) {
      return { error: 'This Oro is not currently accepting bookings' };
    }

    const split = computeBookingSplit(slot.oro.consultPriceCents);

    // Reserve a seat immediately so the slot can't be oversold while payment is in flight.
    const booking = await db.$transaction(async (tx) => {
      const claimed = await tx.availabilitySlot.updateMany({
        where: { id: slotId, bookedCount: { lt: slot.capacity } },
        data: { bookedCount: { increment: 1 } },
      });
      if (claimed.count === 0) throw new Error('This slot is already fully booked');

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
      // Release the seat — payment setup failed before any money moved.
      await db.availabilitySlot.update({ where: { id: slotId }, data: { bookedCount: { decrement: 1 } } });
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

/**
 * Attaches a paying customer to their slot's shared conversation — creating
 * it on the first successful booking, reusing it for every attendee after
 * that. Deliberately bypasses Collab's createGroupConversation/addParticipants,
 * which both require an ACCEPTED Connection: Flash-Consult customers are
 * strangers to the Oro by design (see the Booking model comment).
 */
async function getOrCreateBookingConversation(
  slot: { id: string; oroId: string; conversationId: string | null; capacity: number },
  customerId: string
): Promise<{ conversationId: string; created: boolean }> {
  if (slot.conversationId) {
    await db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: slot.conversationId, userId: customerId } },
      update: {},
      create: { conversationId: slot.conversationId, userId: customerId },
    });
    return { conversationId: slot.conversationId, created: false };
  }

  const conversation = await db.conversation.create({
    data: {
      isGroup: slot.capacity > 1,
      participants: { create: [{ userId: slot.oroId }, { userId: customerId }] },
    },
  });

  const claimed = await db.availabilitySlot.updateMany({
    where: { id: slot.id, conversationId: null },
    data: { conversationId: conversation.id },
  });
  if (claimed.count > 0) return { conversationId: conversation.id, created: true };

  // Lost the race to another attendee's concurrent payment webhook — the
  // conversation just created is an unused orphan, harmless to leave behind.
  const freshSlot = await db.availabilitySlot.findUnique({ where: { id: slot.id }, select: { conversationId: true } });
  const winningConversationId = freshSlot!.conversationId!;
  await db.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: winningConversationId, userId: customerId } },
    update: {},
    create: { conversationId: winningConversationId, userId: customerId },
  });
  return { conversationId: winningConversationId, created: false };
}

/** Webhook-only — not user-callable. Idempotent against webhook redelivery. */
export async function activateBookingAfterPayment(bookingId: string, stripeChargeId: string | null) {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { slot: true } });
  if (!booking) return { error: 'Booking not found' };
  if (booking.status !== 'PENDING_PAYMENT') return { success: true }; // already activated

  const { conversationId, created } = await getOrCreateBookingConversation(booking.slot, booking.customerId);

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: 'SCHEDULED',
      conversationId,
      stripeChargeId: stripeChargeId ?? undefined,
    },
  });

  // Only post the confirmation message once, when the shared conversation is
  // first created — later attendees joining the same group slot shouldn't
  // re-post it into a conversation that's already up and running.
  if (created) {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append(
      'content',
      `Consult booked and confirmed for ${booking.scheduledFor.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}. The call will open here at that time.`
    );
    await sendMessage(booking.oroId, formData);
  }

  await triggerNotification('booking-confirmed', booking.customerId, {
    message: 'Your consult booking is confirmed',
    type: 'booking_confirmed',
    conversationId,
  }, booking.oroId);

  return { success: true, conversationId };
}

// ---------------------------------------------------------------------------
// Call activation at the scheduled time
// ---------------------------------------------------------------------------

/**
 * Client-triggered, deadline-validated — same pattern as
 * enforceCallDurationCutoff in features/collab/actions.ts. Any attendee's
 * client can call this; it only actually starts the call once the real
 * scheduled time has passed, and the LiveKit room is shared across every
 * attendee of the slot (only the first caller actually starts it).
 */
export async function activateScheduledCall(bookingId: string, userId: string) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { slot: true } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.customerId !== userId && booking.oroId !== userId) return { error: 'Not your booking' };
    if (booking.callSessionId) return { success: true }; // already activated for this attendee
    if (!['SCHEDULED', 'RESCHEDULE_ACCEPTED'].includes(booking.status)) {
      return { error: 'This booking is not ready to start' };
    }
    if (!booking.conversationId) return { error: 'Booking has no conversation yet' };
    if (Date.now() < booking.scheduledFor.getTime()) {
      return { error: 'The scheduled time has not arrived yet' };
    }

    let callSessionId = booking.slot.callSessionId;
    if (!callSessionId) {
      const call = await startCall(booking.conversationId, booking.oroId, booking.durationSeconds);
      if ('error' in call) return { error: call.error || 'Failed to start call' };

      const claimed = await db.availabilitySlot.updateMany({
        where: { id: booking.availabilitySlotId, callSessionId: null },
        data: { callSessionId: call.callSessionId },
      });
      if (claimed.count > 0) {
        callSessionId = call.callSessionId ?? null;
      } else {
        // Another attendee's concurrent activation won the race — reuse theirs.
        const freshSlot = await db.availabilitySlot.findUnique({
          where: { id: booking.availabilitySlotId },
          select: { callSessionId: true },
        });
        callSessionId = freshSlot?.callSessionId ?? call.callSessionId ?? null;
      }
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { status: 'SCHEDULED', callSessionId },
    });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to activate call' };
  }
}

/**
 * The caller's own booking in a conversation, with the slot's shared session
 * state included (schedule, no-show/reschedule offer, shared call). Powers
 * BookingBanner for both the customer and the Oro — for the Oro this may
 * resolve to an arbitrary attendee's row (there are many in a group slot),
 * which is fine since only the shared `slot` fields are Oro-facing.
 */
export async function getBookingForConversation(conversationId: string, userId: string) {
  const booking = await db.booking.findFirst({
    where: { conversationId, OR: [{ customerId: userId }, { oroId: userId }] },
    include: { slot: true },
  });
  if (!booking) return { success: true, booking: null };

  return { success: true, booking };
}

// ---------------------------------------------------------------------------
// No-show / reschedule / refund — reporting and offers are slot-wide (one
// missed session affects every attendee the same way); each customer's
// accept/decline response, and the refund it may trigger, stays per-booking.
// ---------------------------------------------------------------------------

export async function reportNoShow(bookingId: string, customerId: string) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { slot: true } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.customerId !== customerId) return { error: 'Only the customer can report a no-show' };
    if (booking.slot.noShowReportedAt) return { success: true }; // already reported by another attendee
    if (booking.status !== 'SCHEDULED') return { error: 'This booking is not in a reportable state' };

    const graceDeadline = booking.scheduledFor.getTime() + booking.durationSeconds * 1000 + NO_SHOW_GRACE_SECONDS * 1000;
    if (Date.now() < graceDeadline) return { error: 'Please wait a little longer before reporting a no-show' };

    await db.availabilitySlot.update({
      where: { id: booking.availabilitySlotId },
      data: { noShowReportedAt: new Date() },
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

/** The Oro's one allowed reschedule offer per no-show report, applied to every attendee of the slot. */
export async function proposeReschedule(bookingId: string, oroId: string, newTime: Date) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { slot: true } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.oroId !== oroId) return { error: 'Only the Oro can propose a reschedule' };
    if (!booking.slot.noShowReportedAt) return { error: 'No no-show report is pending for this consult' };
    if (booking.slot.rescheduleProposedAt) return { error: 'A reschedule has already been offered for this consult' };
    if (newTime.getTime() <= Date.now()) return { error: 'Proposed time must be in the future' };

    await db.availabilitySlot.update({
      where: { id: booking.availabilitySlotId },
      data: { rescheduleProposedAt: new Date(), rescheduleProposedFor: newTime },
    });

    const attendees = await db.booking.findMany({
      where: { availabilitySlotId: booking.availabilitySlotId, status: 'SCHEDULED' },
      select: { customerId: true },
    });
    for (const attendee of attendees) {
      await triggerNotification('booking-reschedule-proposed', attendee.customerId, {
        message: 'The Oro proposed a new time for your consult',
        type: 'booking_reschedule_proposed',
        bookingId,
      }, oroId);
    }

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to propose reschedule' };
  }
}

export async function respondToReschedule(bookingId: string, customerId: string, accept: boolean) {
  try {
    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { slot: true } });
    if (!booking) return { error: 'Booking not found' };
    if (booking.customerId !== customerId) return { error: 'Only the customer can respond to a reschedule' };
    if (!booking.slot.rescheduleProposedAt || !booking.slot.rescheduleProposedFor) {
      return { error: 'No reschedule offer is pending for this booking' };
    }
    if (booking.status !== 'SCHEDULED') return { error: 'You have already responded to this offer' };

    if (!accept) {
      return refundBooking(bookingId, 'Reschedule declined by customer');
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { status: 'RESCHEDULE_ACCEPTED', scheduledFor: booking.slot.rescheduleProposedFor },
    });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to respond to reschedule' };
  }
}

/** Client-triggered, deadline-validated — auto-refunds every attendee who never responded, if the Oro never offers a reschedule. */
export async function expireNoShowWindow(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { slot: true } });
  if (!booking) return { error: 'Booking not found' };
  if (booking.customerId !== userId && booking.oroId !== userId) return { error: 'Not your booking' };
  if (!booking.slot.noShowReportedAt) return { error: 'No no-show report is pending for this consult' };
  if (booking.slot.rescheduleProposedAt) return { error: 'A reschedule has already been offered for this consult' };

  const deadline = booking.slot.noShowReportedAt.getTime() + ORO_RESPONSE_WINDOW_SECONDS * 1000;
  if (Date.now() < deadline) return { error: 'The response window has not expired yet' };

  const pending = await db.booking.findMany({
    where: { availabilitySlotId: booking.availabilitySlotId, status: 'SCHEDULED' },
  });
  for (const b of pending) {
    await refundBooking(b.id, 'Oro did not respond to the no-show report in time');
  }

  return { success: true };
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
