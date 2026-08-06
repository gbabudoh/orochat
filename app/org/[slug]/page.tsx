import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Globe, Users, ArrowLeft, FolderKanban } from 'lucide-react';
import { getOrganizationPublic } from '@/features/oroslate/actions';
import Card from '@/components/ui/Card';
import UserAvatar from '@/components/ui/UserAvatar';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getOrganizationPublic(slug);
  if (!result.success || !result.organization) return { title: 'Organisation not found' };

  const { name, description, industry } = result.organization;
  return {
    title: name,
    description: description || industry || `${name} on Orochat`,
    openGraph: { title: name, description: description || undefined, type: 'website' },
  };
}

export default async function OrganizationPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getOrganizationPublic(slug);

  if (!result.success || !result.organization) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Organisation not found.</p>
          </div>
        </Card>
      </div>
    );
  }

  const org = result.organization;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#458B9E] hover:text-[#3a7585] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card padding="lg">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#366f7e] flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
              {org.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{org.name}</h1>
              {org.industry && <p className="text-sm text-gray-500 mt-0.5">{org.industry}</p>}
              {org.website && (
                <a
                  href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-[#458B9E] hover:underline mt-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {org.website}
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Users className="w-4 h-4 text-[#458B9E] shrink-0" />
              <span className="text-sm text-gray-700">{org.members.length} team member{org.members.length === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <FolderKanban className="w-4 h-4 text-[#458B9E] shrink-0" />
              <span className="text-sm text-gray-700">{org._count.slates} active Slate{org._count.slates === 1 ? '' : 's'}</span>
            </div>
          </div>

          {org.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{org.description}</p>
            </div>
          )}

          {org.members.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Team</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {org.members.map(({ user }) => (
                  <Link
                    key={user.id}
                    href={`/oro/${user.id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <UserAvatar userId={user.id} name={user.name} avatarUrl={user.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      {user.title && <p className="text-xs text-gray-500 truncate">{user.title}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
