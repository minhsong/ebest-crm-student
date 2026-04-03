'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

/** Cổng public: đã có token thì về dashboard. */
export function useRedirectIfLoggedIn() {
  const router = useRouter();
  const { accessToken, ready } = useAuth();

  useEffect(() => {
    if (ready && accessToken) {
      router.replace('/');
    }
  }, [ready, accessToken, router]);

  return { ready, accessToken, shouldHide: ready && !!accessToken };
}
