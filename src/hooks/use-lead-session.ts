'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalSession } from '@/contexts/portal-session-context';
import {
  getPortalActor,
  isPortalSessionReady,
} from '@/lib/portal-auth/portal-session-selectors';
import { homePathForPortalActor } from '@/lib/portal-auth/portal-session-nav';
import { PORTAL_LOGIN_PATH } from '@/lib/portal-auth/session-routes';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';

/** Yêu cầu phiên lead — customer → trang chủ HV; guest → login (có returnUrl nếu truyền). */
export function useRequireLeadSession(
  loginRedirect: string = PORTAL_LOGIN_PATH,
) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const portal = usePortalSession();
  const portalReady = isPortalSessionReady(portal);
  const actor = getPortalActor(portal);

  useEffect(() => {
    if (!portalReady) return;

    if (actor === 'customer') {
      router.replace(homePathForPortalActor('customer'));
      return;
    }
    if (actor === 'lead') {
      setReady(true);
      setChecking(false);
      return;
    }

    const href =
      loginRedirect === PORTAL_LOGIN_PATH
        ? PORTAL_LOGIN_PATH
        : buildPortalLoginHref({ returnUrl: loginRedirect }) || PORTAL_LOGIN_PATH;
    router.replace(href);
  }, [portalReady, actor, loginRedirect, router]);

  return { checking, ready };
}
