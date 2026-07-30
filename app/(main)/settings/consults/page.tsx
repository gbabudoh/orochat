import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import ConsultSettingsForm from '@/components/settings/ConsultSettingsForm';
import AvailabilityManager from '@/components/settings/AvailabilityManager';
import { getAvailabilitySlots } from '@/features/booking/actions';

export default async function ConsultsSettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      stripeConnectOnboarded: true,
      consultEnabled: true,
      consultPriceCents: true,
      consultDurations: true,
      consultTopic: true,
      consultDescription: true,
      consultOutcomes: true,
    },
  });

  const slots = await getAvailabilitySlots(userId, false);

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1">Flash-Consult</h1>
      <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed">
        Offer paid, scheduled video consults directly on your profile. Bookings pay out 70% to you and
        30% to Orochat, split automatically the moment a customer pays.
      </p>

      {!user?.stripeConnectOnboarded ? (
        <Card padding="lg">
          <p className="text-sm text-gray-600">
            Finish setting up your payout account before you can accept paid consults.{' '}
            <Link href="/settings/payouts" className="text-[#458B9E] hover:underline font-medium">
              Go to Payment Setup
            </Link>
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card padding="none" className="p-4 sm:p-6">
            <ConsultSettingsForm
              userId={userId}
              initialEnabled={user.consultEnabled}
              initialPriceCents={user.consultPriceCents}
              initialDurations={user.consultDurations}
              initialTopic={user.consultTopic}
              initialDescription={user.consultDescription}
              initialOutcomes={user.consultOutcomes}
            />
          </Card>

          {user.consultEnabled && (
            <Card padding="none" className="p-4 sm:p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Available times</h2>
              <AvailabilityManager
                userId={userId}
                initialSlots={(slots as any[]).map((s) => ({
                  id: s.id,
                  startAt: typeof s.startAt === 'string' ? s.startAt : new Date(s.startAt).toISOString(),
                  durationSeconds: s.durationSeconds,
                  capacity: s.capacity ?? 1,
                  bookedCount: s.bookedCount ?? (s.isBooked ? 1 : 0),
                }))}
                allowedDurations={user.consultDurations}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
