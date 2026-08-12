'use client';

import { Component, ReactNode, useEffect, useState } from 'react';
import { Inbox } from '@novu/nextjs';

interface NovuInboxProps {
  subscriberId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class NovuErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Novu Inbox notification component encountered an error:', error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default function NovuInbox({ subscriberId }: NovuInboxProps) {
  const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APP_IDENTIFIER;
  const backendUrl = process.env.NEXT_PUBLIC_NOVU_BACKEND_URL;
  const rawSocketUrl = process.env.NEXT_PUBLIC_NOVU_SOCKET_URL;
  const [socketUrl, setSocketUrl] = useState<string | undefined>(
    rawSocketUrl && !rawSocketUrl.includes('feendesk.com') ? rawSocketUrl : undefined
  );

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes('socket') ||
        event.reason?.message?.includes('WebSocket') ||
        String(event.reason).includes('novu')
      ) {
        setSocketUrl(undefined);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  if (!applicationIdentifier || !subscriberId) {
    return null;
  }

  return (
    <NovuErrorBoundary>
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriberId={subscriberId}
        backendUrl={backendUrl || undefined}
        socketUrl={socketUrl}
        appearance={{
          variables: {
            colorPrimary: '#458B9E',
          },
        }}
      />
    </NovuErrorBoundary>
  );
}
