import Card from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card padding="lg">
        <h1 className="text-4xl font-bold text-[#333333] mb-6">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mb-6">
            At Orochat, we are committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, and safeguard your personal information.
          </p>
          
          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us, including your name, email address,
            professional title, company, and any other information you choose to share in your profile.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">How We Use Your Information</h2>
          <p className="mb-4">
            We use your information to provide, maintain, and improve our services, process transactions,
            and communicate with you about your account and our services.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us.
          </p>
        </div>
      </Card>
    </div>
  );
}

