import Link from 'next/link';
import { ArrowLeft, User, Building } from 'lucide-react';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';

export default async function ConsultsDirectoryPage() {
  const oros = await db.user.findMany({
    where: { consultEnabled: true, isPaused: false },
    select: {
      id: true,
      name: true,
      avatar: true,
      title: true,
      company: true,
      consultTopic: true,
      consultPriceCents: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/oro"
          className="inline-flex items-center gap-1.5 text-sm text-[#458B9E] hover:text-[#3a7585] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Oros
        </Link>
        <h1 className="text-2xl font-bold text-[#333333] mb-2">Find a consult</h1>
        <p className="text-gray-600">Oros currently offering paid, scheduled video consults</p>
      </div>

      {oros.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No one is offering consults right now</p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {oros.map((oro) => (
            <Link key={oro.id} href={`/oro/${oro.id}`}>
              <Card hover className="p-6 h-full">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-[#458B9E] flex items-center justify-center overflow-hidden shrink-0">
                    {oro.avatar ? (
                      <img
                        src={`/api/user/${oro.id}/avatar`}
                        alt={oro.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#333333] truncate">{oro.name}</h3>
                    {oro.title && <p className="text-sm text-gray-600 truncate mt-0.5">{oro.title}</p>}
                    {oro.company && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Building className="w-3 h-3 mr-1" />
                        <span className="truncate">{oro.company}</span>
                      </div>
                    )}
                    <p className="text-sm font-medium text-[#333333] mt-3">{oro.consultTopic}</p>
                    {oro.consultPriceCents && (
                      <p className="text-sm text-[#458B9E] font-semibold mt-1">
                        ${(oro.consultPriceCents / 100).toFixed(2)} per consult
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
