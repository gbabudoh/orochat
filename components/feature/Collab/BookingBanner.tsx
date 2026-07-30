'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Booking } from '@prisma/client';
import Button from '@/components/ui/Button';
import {
  getBookingForConversation,
  activateScheduledCall,
  reportNoShow,
  proposeReschedule,
  respondToReschedule,
  expireNoShowWindow,
} from '@/features/booking/actions';

const POLL_INTERVAL_MS = 5000;
const NO_SHOW_GRACE_SECONDS = 600;
const ORO_RESPONSE_WINDOW_SECONDS = 86400;

function formatTime(date: Date) {
  return new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

interface BookingBannerProps {
  conversationId: string;
  currentUserId: string;
}

export default function BookingBanner({ conversationId, currentUserId }: BookingBannerProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isActing, setIsActing] = useState(false);
  const autoActionInFlight = useRef(false);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      const result = await getBookingForConversation(conversationId, currentUserId);
      if (!active || 'error' in result) return;
      setBooking(result.booking);

      if (autoActionInFlight.current || !result.booking) return;
      const b = result.booking;

      const effectiveTime = b.status === 'RESCHEDULE_ACCEPTED' ? b.rescheduleProposedFor : b.status === 'SCHEDULED' ? b.scheduledFor : null;
      if (effectiveTime && !b.callSessionId && Date.now() >= new Date(effectiveTime).getTime()) {
        autoActionInFlight.current = true;
        await activateScheduledCall(b.id, currentUserId);
        autoActionInFlight.current = false;
        return;
      }

      if (b.status === 'NO_SHOW_REPORTED' && b.noShowReportedAt) {
        const deadline = new Date(b.noShowReportedAt).getTime() + ORO_RESPONSE_WINDOW_SECONDS * 1000;
        if (Date.now() >= deadline) {
          autoActionInFlight.current = true;
          await expireNoShowWindow(b.id, currentUserId);
          autoActionInFlight.current = false;
        }
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [conversationId, currentUserId]);

  if (!booking) return null;

  const isOro = booking.oroId === currentUserId;
  const isCustomer = booking.customerId === currentUserId;

  const canReportNoShow =
    isCustomer &&
    booking.status === 'SCHEDULED' &&
    Date.now() >= booking.scheduledFor.getTime() + booking.durationSeconds * 1000 + NO_SHOW_GRACE_SECONDS * 1000;

  const handleReportNoShow = async () => {
    setIsActing(true);
    const result = await reportNoShow(booking.id, currentUserId);
    setIsActing(false);
    if ('error' in result) toast.error(result.error);
  };

  const handlePropose = async () => {
    if (!rescheduleTime) return;
    setIsActing(true);
    const result = await proposeReschedule(booking.id, currentUserId, new Date(rescheduleTime));
    setIsActing(false);
    if ('error' in result) toast.error(result.error);
  };

  const handleRespond = async (accept: boolean) => {
    setIsActing(true);
    const result = await respondToReschedule(booking.id, currentUserId, accept);
    setIsActing(false);
    if ('error' in result) toast.error(result.error);
  };

  return (
    <div className="mx-3 sm:mx-4 mt-3 p-3 rounded-lg border border-[#458B9E]/30 bg-[#458B9E]/5 text-sm">
      {booking.status === 'SCHEDULED' && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[#333333]">Consult scheduled for {formatTime(booking.scheduledFor)}.</span>
          {canReportNoShow && (
            <Button type="button" variant="ghost" size="sm" onClick={handleReportNoShow} isLoading={isActing}>
              Report no-show
            </Button>
          )}
        </div>
      )}

      {booking.status === 'NO_SHOW_REPORTED' && (
        <div>
          {isOro ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#333333]">A no-show was reported. Offer a new time:</span>
              <input
                type="datetime-local"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="px-3 py-1.5 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
              />
              <Button type="button" size="sm" onClick={handlePropose} isLoading={isActing} disabled={!rescheduleTime}>
                Propose
              </Button>
            </div>
          ) : (
            <span className="text-[#333333]">Waiting for the Oro to respond to your no-show report.</span>
          )}
        </div>
      )}

      {booking.status === 'RESCHEDULE_PROPOSED' && booking.rescheduleProposedFor && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[#333333]">New time proposed: {formatTime(booking.rescheduleProposedFor)}.</span>
          {isCustomer && (
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => handleRespond(true)} isLoading={isActing}>
                Accept
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleRespond(false)} isLoading={isActing}>
                Decline (refund)
              </Button>
            </div>
          )}
        </div>
      )}

      {booking.status === 'RESCHEDULE_ACCEPTED' && booking.rescheduleProposedFor && (
        <span className="text-[#333333]">Rescheduled for {formatTime(booking.rescheduleProposedFor)}.</span>
      )}

      {booking.status === 'REFUNDED' && (
        <span className="text-gray-500">This consult was refunded.</span>
      )}
    </div>
  );
}
