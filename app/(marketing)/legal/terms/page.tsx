import Card from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card padding="lg">
        <h1 className="text-4xl font-bold text-[#333333] mb-6">Terms of Service</h1>
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="mb-6">
            By accessing or using Orochat, you agree to be bound by these Terms of Service.
          </p>
          
          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Acceptable Use</h2>
          <p className="mb-4">
            You agree to use Orochat only for lawful purposes and in accordance with these Terms.
            You may not use the service to transmit any harmful, offensive, or illegal content.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">User Accounts</h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Revenue Sharing</h2>
          <p className="mb-4">
            Revenue sharing is available only to qualified Orochat Partners. Qualification requirements
            and payout calculations are subject to change with notice.
          </p>

          <h2 className="text-2xl font-semibold text-[#333333] mt-8 mb-4">Limitation of Liability</h2>
          <p className="mb-4">
            Orochat shall not be liable for any indirect, incidental, special, or consequential damages
            arising out of or in connection with your use of the service.
          </p>
        </div>
      </Card>
    </div>
  );
}

