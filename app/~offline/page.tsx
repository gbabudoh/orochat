import Image from 'next/image';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Image src="/icon.png" alt="Orochat" width={72} height={72} className="mb-6 opacity-80" />
      <h1 className="text-2xl font-bold text-[#333333] mb-2">You&apos;re offline</h1>
      <p className="text-gray-600 max-w-sm">
        Orochat couldn&apos;t reach the network. Check your connection and try again.
      </p>
    </div>
  );
}
