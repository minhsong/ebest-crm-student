'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

/** Cổng public: đã có token thì về dashboard. */
export function useRedirectIfLoggedIn() {
  const router = useRouter();
  const { customer, ready } = useAuth();

  useEffect(() => {
    if (ready && customer) {
      router.replace('/');
    }
  }, [ready, customer, router]);

  return { ready, customer, shouldHide: ready && !!customer };
}
