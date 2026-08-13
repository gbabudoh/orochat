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

// How often (and when) to force the widget to re-fetch its notification/unread
// state from scratch, instead of relying solely on the live socket to push
// updates. This self-hosted Novu instance's WebSocket sync has proven
// unreliable for propagating read-state changes (the unread badge can get
// stuck after a notification is read), so a periodic remount — which forces
// a fresh REST fetch of counts/notifications — is a defensive fallback that
// guarantees the badge eventually catches up regardless of socket behavior.
const REFRESH_INTERVAL_MS = 20000;

export default function NovuInbox({ subscriberId }: NovuInboxProps) {
  const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APP_IDENTIFIER;
  const backendUrl = process.env.NEXT_PUBLIC_NOVU_BACKEND_URL;
  const rawSocketUrl = process.env.NEXT_PUBLIC_NOVU_SOCKET_URL;
  const [socketUrl, setSocketUrl] = useState<string | undefined>(rawSocketUrl || undefined);
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!applicationIdentifier || !subscriberId) {
    return null;
  }

  return (
    <NovuErrorBoundary>
      <Inbox
        key={refreshKey}
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
