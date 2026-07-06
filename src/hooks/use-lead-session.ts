'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { probeLeadSession } from '@/lib/lead-portal/client-api';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';

/** Redirect nếu đã có cookie lead hợp lệ (hoặc đã silent upgrade sang HV). */
export function useRedirectIfLeadLoggedIn(
  redirectTo = PORTAL_MOCK_TEST_RESULTS_ROUTES.lead,
) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const probe = await probeLeadSession();
      if (!cancelled) {
        if (probe.kind === 'student') {
          router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.student);
        } else if (probe.kind === 'lead') {
          router.replace(redirectTo);
        } else {
          setChecking(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [redirectTo, router]);

  return { checking };
}

/** Yêu cầu phiên lead — guest → `/login?mode=lead`. */
export function useRequireLeadSession(loginRedirect = '/login?mode=lead') {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const probe = await probeLeadSession();
      if (cancelled) return;
      if (probe.kind === 'student') {
        router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.student);
        return;
      }
      if (probe.kind === 'lead') {
        setReady(true);
        setChecking(false);
        return;
      }
      router.replace(loginRedirect);
    })();
    return () => {
      cancelled = true;
    };
  }, [loginRedirect, router]);

  return { checking, ready };
}
