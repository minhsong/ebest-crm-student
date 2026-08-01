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
import {
  buildAuthRequiredLoginHref,
  recoverInvalidPortalSession,
} from '@/lib/portal-auth/portal-session-recovery';

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

    const authFailure =
      portal.status === 'ready' && portal.actor === 'guest'
        ? portal.authFailure
        : undefined;

    if (authFailure) {
      void recoverInvalidPortalSession({
        returnUrl: loginRedirect === PORTAL_LOGIN_PATH ? undefined : loginRedirect,
        sessionExpired: true,
      });
      return;
    }

    const href =
      loginRedirect === PORTAL_LOGIN_PATH
        ? buildAuthRequiredLoginHref({ returnUrl: '/' })
        : buildAuthRequiredLoginHref({ returnUrl: loginRedirect });
    router.replace(href);
  }, [portalReady, actor, loginRedirect, router, portal]);

  return { checking, ready };
}
