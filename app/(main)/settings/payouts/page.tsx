import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import ConnectPayoutsButton from '@/components/settings/ConnectPayoutsButton';

export default async function PayoutsSettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeConnectAccountId: true, stripeConnectOnboarded: true },
  });

  const isConnected = !!user?.stripeConnectAccountId;
  const isActive = !!user?.stripeConnectOnboarded;
  const isPending = isConnected && !isActive;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-1">Payment Setup</h1>
      <p className="text-sm text-gray-500 mb-6">
        Connect a Stripe payout account to receive your share of the monthly ad revenue pool. Looking for your
        earnings? Visit the{' '}
        <Link href="/payouts" className="text-[#458B9E] hover:underline font-medium">
          Payouts page
        </Link>
        .
      </p>

      <Card padding="lg">
        <h2 className="font-semibold text-[#333333] mb-1">Payout Account</h2>
        <p className="text-sm text-gray-500 mb-4">
          This is the bank/payment account ad revenue is sent to.
        </p>

        {!isConnected && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">Not connected</p>
            <ConnectPayoutsButton label="Connect payout account" />
          </div>
        )}

        {isPending && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-amber-600 font-medium">Setup incomplete — finish onboarding to receive payouts</p>
            <ConnectPayoutsButton label="Finish setup" />
          </div>
        )}

        {isActive && (
          <p className="text-sm text-green-600 font-medium">Connected — ready to receive payouts</p>
        )}
      </Card>
    </div>
  );
}
