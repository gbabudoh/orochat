import { getPlatformConfig } from '@/lib/platformConfig';
import { getAdminSession } from '@/lib/auth.admin';
import Card from '@/components/ui/Card';
import PlatformSplitForm from '@/components/admin/PlatformSplitForm';

export default async function AdminSettingsPage() {
  const [config, session] = await Promise.all([getPlatformConfig(), getAdminSession()]);
  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Settings</h1>

      <Card className="max-w-md">
        <h2 className="font-semibold text-[#333333] mb-1">Ad Revenue Split</h2>
        <p className="text-sm text-gray-500 mb-4">
          Share of gross ad revenue paid into the Oro revenue pool each month. The remainder is retained by Orochat.
        </p>
        {isSuperAdmin ? (
          <PlatformSplitForm oroSharePercent={config.oroSharePercent} />
        ) : (
          <div>
            <p className="text-lg font-semibold text-[#333333]">
              {(config.oroSharePercent * 100).toFixed(0)}% Oros / {((1 - config.oroSharePercent) * 100).toFixed(0)}% Orochat
            </p>
            <p className="text-xs text-gray-400 mt-1">Only Super Admins can change this setting.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
