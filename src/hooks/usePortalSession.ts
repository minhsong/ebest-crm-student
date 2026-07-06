'use client';

import { useCallback, useEffect, useState } from 'react';

type PortalSessionApiResponse =
  | { actor: 'guest' }
  | { actor: 'customer'; displayName: string }
  | { actor: 'lead'; displayName: string };

export type PortalSessionState =
  | { status: 'loading' }
  | { status: 'ready'; actor: 'guest' }
  | {
      status: 'ready';
      actor: 'customer';
      displayName: string;
    }
  | {
      status: 'ready';
      actor: 'lead';
      displayName: string;
    };

export function usePortalSession(): PortalSessionState {
  const [state, setState] = useState<PortalSessionState>({ status: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/session', { cache: 'no-store' });
      if (!res.ok) {
        setState({ status: 'ready', actor: 'guest' });
        return;
      }
      const data = (await res.json()) as PortalSessionApiResponse;

      if (data.actor === 'customer') {
        setState({
          status: 'ready',
          actor: 'customer',
          displayName: data.displayName ?? 'Học viên',
        });
        return;
      }
      if (data.actor === 'lead') {
        setState({
          status: 'ready',
          actor: 'lead',
          displayName: data.displayName ?? 'Thí sinh',
        });
        return;
      }
      setState({ status: 'ready', actor: 'guest' });
    } catch {
      setState({ status: 'ready', actor: 'guest' });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return state;
}
