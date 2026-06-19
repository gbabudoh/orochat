import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import ProductPreview from '@/components/marketing/ProductPreview';

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  // If authenticated, redirect to feed
  if (session) {
    redirect('/feed');
  }

  // If not authenticated, show split-screen landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F5F5F5] to-[#F0F0F0] overflow-hidden">
      <div className="min-h-screen flex items-center justify-center lg:gap-8 lg:px-6 px-4 py-8">
        {/* Left Side - Logo, Pitch and Product Preview */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-end">
          <div className="w-full max-w-xl pr-4">
            <div className="mb-8">
              <img src="/logo.png" alt="Orochat Logo" className="h-20 w-auto" />
            </div>

            <h1 className="text-5xl xl:text-6xl font-bold text-[#333333] mb-6 leading-tight">
              Your Network.
              <span className="block text-[#458B9E] mt-2">Your Earnings.</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Orochat is the professional network where verified Oros and Compass communities turn
              real connections into a revenue share — entirely free, with no paywalls.
            </p>

            <ProductPreview />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center lg:justify-start justify-center lg:px-0 lg:py-12">
          <div className="w-full max-w-md lg:pl-4">
            <div className="lg:hidden mb-8 text-center">
              <div className="mb-6">
                <img src="/logo.png" alt="Orochat Logo" className="h-20 w-auto mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-[#333333] mb-2">Your Network. Your Earnings.</h2>
              <p className="text-[#458B9E] font-semibold text-lg">Free professional networking</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
