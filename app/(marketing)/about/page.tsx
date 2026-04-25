import Card from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card padding="lg">
        <h1 className="text-4xl font-bold text-[#333333] mb-6">About Orochat</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Orochat is a free, professional networking platform designed to eliminate the paywalls,
            aggressive sales tactics, and pay-to-play schemes of existing corporate networks.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Our Vision</h2>
          <p className="text-gray-600 mb-6">
            We believe that professionals who generate value for the network should be financially rewarded.
            Unlike traditional platforms that charge users for basic features, Orochat operates on a
            revenue-sharing model where qualified partners share in the platform's success.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">How It Works</h2>
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-[#F0F3F7] rounded-lg">
              <h3 className="font-semibold text-[#333333] mb-2">1. Build Your Network</h3>
              <p className="text-gray-600">
                Connect with verified professionals (Oros) and join high-value communities (Compass).
              </p>
            </div>
            <div className="p-4 bg-[#F0F3F7] rounded-lg">
              <h3 className="font-semibold text-[#333333] mb-2">2. Qualify as a Partner</h3>
              <p className="text-gray-600">
                Reach 1,000 verified Oros or join 10 Compass communities to become an Orochat Partner.
              </p>
            </div>
            <div className="p-4 bg-[#F0F3F7] rounded-lg">
              <h3 className="font-semibold text-[#333333] mb-2">3. Earn Revenue Share</h3>
              <p className="text-gray-600">
                Partners receive monthly payouts based on their Total Engagement Score (TES),
                calculated from their network's activity.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Our Values</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Free and equitable access for all professionals</li>
            <li>Transparent qualification and reward systems</li>
            <li>High-quality, curated communities</li>
            <li>Non-intrusive, contextual advertising</li>
            <li>User-centric design and experience</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

