'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { getAvailabilitySlots, createBookingIntent, getBookingStatus } from '@/features/booking/actions';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface Slot {
  id: string;
  startAt: Date;
  durationSeconds: number;
  capacity: number;
  bookedCount: number;
}

const DURATION_LABELS: Record<number, string> = {
  900: '15 min',
  1800: '30 min',
  2700: '45 min',
  3600: '60 min',
};

interface BookConsultButtonProps {
  oroId: string;
  customerId: string;
  priceCents: number;
  topic: string;
  description?: string | null;
  outcomes?: string | null;
}

export default function BookConsultButton({ oroId, customerId, priceCents, topic, description, outcomes }: BookConsultButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [checkout, setCheckout] = useState<{ bookingId: string; clientSecret: string } | null>(null);

  const open = async () => {
    setIsOpen(true);
    setCheckout(null);
    setSelectedSlotId(null);
    const openSlots = await getAvailabilitySlots(oroId, true);
    setSlots(openSlots);
  };

  const handleContinue = async () => {
    if (!selectedSlotId) return;
    setIsStarting(true);
    const result = await createBookingIntent(customerId, selectedSlotId);
    setIsStarting(false);

    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    setCheckout({ bookingId: result.bookingId, clientSecret: result.clientSecret });
  };

  return (
    <>
      <Button type="button" onClick={open} size="sm" className="w-full sm:w-auto rounded-xl text-xs sm:text-sm font-semibold shadow-2xs whitespace-nowrap">
        Book a consult
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Book a consult">
        {!checkout ? (
          <div className="space-y-4">
            <p className="font-medium text-[#333333]">{topic}</p>
            {description && <p className="text-sm text-gray-600 whitespace-pre-line">{description}</p>}
            {outcomes && (
              <div>
                <p className="text-xs font-semibold text-[#333333] uppercase tracking-wide mb-1">What you&apos;ll get</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{outcomes}</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              ${(priceCents / 100).toFixed(2)} per consult. Pick an available time:
            </p>

            {!slots ? (
              <p className="text-sm text-gray-500">Loading available times…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-500">No open times right now — check back later.</p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {slots.map((slot) => (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-colors ${
                        selectedSlotId === slot.id
                          ? 'border-[#458B9E] bg-[#458B9E]/5'
                          : 'border-gray-200 hover:border-[#458B9E]/40'
                      }`}
                    >
                      <span className="text-sm font-medium text-[#333333]">
                        {new Date(slot.startAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {DURATION_LABELS[slot.durationSeconds] ?? `${slot.durationSeconds / 60} min`}
                      </span>
                      {slot.capacity > 1 && (
                        <span className="ml-2 text-xs text-gray-500">
                          {slot.capacity - slot.bookedCount} seat{slot.capacity - slot.bookedCount === 1 ? '' : 's'} left
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleContinue} isLoading={isStarting} disabled={!selectedSlotId}>
                Continue to payment
              </Button>
            </div>
          </div>
        ) : stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret: checkout.clientSecret }}>
            <CheckoutForm bookingId={checkout.bookingId} customerId={customerId} onClose={() => setIsOpen(false)} />
          </Elements>
        ) : (
          <p className="text-sm text-red-500">Payments are not configured.</p>
        )}
      </Modal>
    </>
  );
}

function CheckoutForm({ bookingId, customerId, onClose }: { bookingId: string; customerId: string; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;
    const interval = setInterval(async () => {
      const result = await getBookingStatus(bookingId, customerId);
      if ('error' in result) return;
      if (result.booking.status === 'SCHEDULED' && result.booking.conversationId) {
        clearInterval(interval);
        onClose();
        router.push(`/collab/${result.booking.conversationId}`);
      } else if (result.booking.status === 'CANCELLED') {
        clearInterval(interval);
        setIsConfirming(false);
        toast.error('Payment was not completed');
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isConfirming, bookingId, customerId, onClose, router]);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsPaying(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    setIsPaying(false);

    if (error) {
      toast.error(error.message || 'Payment failed');
      return;
    }

    setIsConfirming(true);
  };

  if (isConfirming) {
    return <p className="text-sm text-gray-600">Confirming your booking…</p>;
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      <div className="flex justify-end">
        <Button type="button" onClick={handlePay} isLoading={isPaying} disabled={!stripe}>
          Pay & book
        </Button>
      </div>
    </div>
  );
}
