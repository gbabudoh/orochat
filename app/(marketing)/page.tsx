import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ArrowRight, Users, MessageSquare, Compass, TrendingUp, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-bold text-[#333333] mb-6">
          Professional Networking
          <span className="block text-[#458B9E]">Without Paywalls</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with verified professionals, collaborate securely, and join high-value communities.
          Build your network and get rewarded for it.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" size="lg" className="text-lg">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#458B9E]/30 transition-all duration-200">
          <div className="w-12 h-12 bg-[#458B9E] rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-[#333333] mb-2">Verified Oros</h3>
          <p className="text-gray-600">
            Build meaningful connections with verified professionals. No spam, no fake profiles.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#458B9E]/30 transition-all duration-200">
          <div className="w-12 h-12 bg-[#458B9E] rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-[#333333] mb-2">Collab Tool</h3>
          <p className="text-gray-600">
            Secure, instant messaging with your Oros. Communicate without barriers or limitations.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#458B9E]/30 transition-all duration-200">
          <div className="w-12 h-12 bg-[#458B9E] rounded-lg flex items-center justify-center mb-4">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-[#333333] mb-2">Compass Communities</h3>
          <p className="text-gray-600">
            Join curated professional communities focused on your industry and interests.
          </p>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-gradient-to-r from-[#458B9E] to-[#3a7585] rounded-2xl p-12 text-white mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-[#FFC93C] rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-8 h-8 text-[#333333]" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Get Rewarded for Building Value</h2>
          <p className="text-lg opacity-90 mb-8">
            Become an Orochat Partner by reaching 1,000 verified Oros or joining 10 Compass communities.
            Qualified partners share in ad revenue based on their network's engagement.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold mb-2">100% Free</h3>
              <p className="opacity-90 text-sm">
                All core features are free. No premium subscriptions, no paywalls.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold mb-2">Revenue Share</h3>
              <p className="opacity-90 text-sm">
                Partners receive monthly payouts based on their Total Engagement Score (TES).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-[#333333] mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-8">
          Join Orochat today and start building your professional network.
        </p>
        <Link href="/signup">
          <Button size="lg" variant="accent" className="text-lg px-8">
            Create Your Free Account
          </Button>
        </Link>
      </section>
    </div>
  );
}

