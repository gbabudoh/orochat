import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConsultSettingsForm from '@/components/settings/ConsultSettingsForm';
import AvailabilityManager from '@/components/settings/AvailabilityManager';
import ConsultSettingsHeaderGuide from '@/components/feature/Settings/ConsultSettingsHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { getAvailabilitySlots } from '@/features/booking/actions';
import { AlertCircle, ArrowRight, Video, DollarSign, Calendar, Zap, ShieldCheck } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto w-full min-w-0 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">Flash-Consult</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#458B9E]/10 text-[#458B9E] border border-[#458B9E]/20">
              <Zap className="w-3 h-3" /> 70% Revenue Cut
            </span>
            <HelpTooltip
              title="Flash-Consult Settings Guide"
              description="Offer paid, scheduled 1-on-1 video call consultations on your profile with 70% direct payouts."
              tips={[
                'Set your fixed session price ($/consult), topic title, and outcomes.',
                'Specify supported session durations (15m, 30m, 60m).',
                'Create availability time slots for clients to book.',
                'Must complete Stripe payout setup to receive booking payments.',
              ]}
            />
          </div>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
            Offer paid, scheduled video consults directly on your profile. Bookings pay out 70% to you and
            30% to Orochat, split automatically the moment a customer pays.
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <ConsultSettingsHeaderGuide />
        </div>
      </div>

      {!user?.stripeConnectOnboarded ? (
        <div className="space-y-6">
          {/* Amber Payout Callout Banner */}
          <Card padding="none" className="p-5 sm:p-6 border-2 border-amber-200 bg-amber-50/70 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-amber-950 text-base sm:text-lg">Payout Account Setup Required</h3>
                    <span className="inline-flex items-center justify-center shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900 uppercase tracking-wider">
                      Action Needed
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed max-w-xl">
                    Connect your bank account or debit card via Stripe Connect to unlock Flash-Consults and receive automated 70% revenue payouts.
                  </p>
                </div>
              </div>

              <Link href="/settings/payouts" className="shrink-0">
                <Button type="button" className="w-full sm:w-auto rounded-xl bg-[#458B9E] hover:bg-[#387383] text-white shadow-xs gap-1.5 px-5 py-2.5">
                  <span>Set Up Payout Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Feature Preview Grid (What You Unlock) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#458B9E]" />
              <span>What You Unlock With Flash-Consult</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Feature 1 */}
              <Card padding="none" className="p-5 border border-gray-200/90 rounded-2xl bg-white shadow-sm hover:border-[#458B9E]/40 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 mb-3">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">70% Direct Revenue</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Receive 70% of session fees deposited directly to your bank account upon booking completion.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card padding="none" className="p-5 border border-gray-200/90 rounded-2xl bg-white shadow-sm hover:border-[#458B9E]/40 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 mb-3">
                  <Video className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">HD Video Rooms</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Automatic integrated video room generation, calendar invitations, and email reminders.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card padding="none" className="p-5 border border-gray-200/90 rounded-2xl bg-white shadow-sm hover:border-[#458B9E]/40 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80 mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Flexible Scheduling</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Define custom 15m, 30m, or 60m session durations and manage weekly availability slots.
                </p>
              </Card>
            </div>
          </div>
        </div>
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
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-lg">Available Times</h2>
                <HelpTooltip
                  title="Scheduling Availability Slots"
                  description="Set time windows when clients can schedule video consultation calls with you."
                  tips={[
                    'Create recurring weekly or specific date/time availability slots.',
                    'Manage slot capacity for 1-on-1 or group consults.',
                  ]}
                  align="right"
                />
              </div>
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
