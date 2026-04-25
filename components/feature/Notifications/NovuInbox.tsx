'use client';

import { Inbox } from '@novu/nextjs';

interface NovuInboxProps {
  subscriberId: string;
}

export default function NovuInbox({ subscriberId }: NovuInboxProps) {
  const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APP_IDENTIFIER;

  if (!applicationIdentifier || !subscriberId) {
    return null;
  }

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      backendUrl={process.env.NEXT_PUBLIC_NOVU_BACKEND_URL || 'https://novu.feendesk.com/api'}
      socketUrl={process.env.NEXT_PUBLIC_NOVU_SOCKET_URL}
    />
  );
}
