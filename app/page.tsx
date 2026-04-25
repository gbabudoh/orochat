import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  // If authenticated, redirect to feed
  if (session) {
    redirect('/feed');
  }

  // If not authenticated, show split-screen landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F5F5F5] to-[#F0F0F0]">
      <div className="min-h-screen flex items-center justify-center lg:gap-4 lg:px-6 px-4 py-8">
        {/* Left Side - Logo and About Text */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-end">
          <div className="w-full max-w-xl pr-4">
            <div className="mb-8">
              <img src="/logo.png" alt="Orochat Logo" className="h-20 w-auto" />
            </div>

            <h1 className="text-5xl xl:text-6xl font-bold text-[#333333] mb-6 leading-tight">
              Professional Networking
              <span className="block text-[#458B9E] mt-2">Without Paywalls</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Connect with verified professionals, collaborate securely, and join high-value communities.
              Build your network and get rewarded for it.
            </p>

            <div className="space-y-5 text-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-[#458B9E] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg leading-relaxed">100% free - No premium subscriptions or paywalls</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-[#458B9E] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg leading-relaxed">Verified connections with real professionals</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-[#458B9E] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg leading-relaxed">Earn revenue share as an Orochat Partner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center lg:justify-start justify-center lg:px-0 lg:py-12">
          <div className="w-full max-w-lg lg:pl-4">
            <div className="lg:hidden mb-8 text-center">
              <div className="mb-6">
                <img src="/logo.png" alt="Orochat Logo" className="h-20 w-auto mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-[#333333] mb-2">Professional Networking</h2>
              <p className="text-[#458B9E] font-semibold text-lg">Without Paywalls</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
