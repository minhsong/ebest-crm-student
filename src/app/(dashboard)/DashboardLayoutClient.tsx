'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { usePortalSession } from '@/contexts/portal-session-context';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { GameExitGuardProvider } from '@/features/learning/games/session/game-exit-guard.context';
import { buildDashboardMenuAntdItems } from '@/lib/dashboard-menu';
import {
  getCustomerClassesFromPortalSession,
  getCustomerFromPortalSession,
  getPortalActor,
  isCustomerPortalShellReady,
  isPortalSessionReady,
} from '@/lib/portal-auth/portal-session-selectors';
import { resolveLeadRedirectFromSession } from '@/lib/portal-auth/resolve-lead-navigation';
import {
  buildAuthRequiredLoginHref,
  recoverInvalidPortalSession,
} from '@/lib/portal-auth/portal-session-recovery';

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const portal = usePortalSession();
  const router = useRouter();
  const recoveringRef = useRef(false);

  const portalReady = isPortalSessionReady(portal);
  const actor = getPortalActor(portal);
  const customer = getCustomerFromPortalSession(portal);
  const shellReady = isCustomerPortalShellReady(portal);

  useEffect(() => {
    if (!portalReady || recoveringRef.current) return;

    if (actor === 'guest') {
      recoveringRef.current = true;
      const authFailure =
        portal.status === 'ready' && portal.actor === 'guest'
          ? portal.authFailure
          : undefined;
      if (authFailure) {
        void recoverInvalidPortalSession({ sessionExpired: true });
        return;
      }
      router.replace(
        buildAuthRequiredLoginHref({
          returnUrl:
            typeof window !== 'undefined'
              ? `${window.location.pathname}${window.location.search}`
              : '/',
        }),
      );
      return;
    }

    if (actor === 'lead' && portal.status === 'ready' && portal.actor === 'lead') {
      router.replace(resolveLeadRedirectFromSession(portal, null));
    }
  }, [portalReady, actor, portal, router]);

  const menuItems = useMemo(
    () =>
      buildDashboardMenuAntdItems((path, label) => <Link href={path}>{label}</Link>, {
        classes: getCustomerClassesFromPortalSession(portal),
      }),
    [portal],
  );

  const handleLogout = () => {
    void logout();
  };

  return (
    <GameExitGuardProvider>
      <PortalDashboardShell
        ready={shellReady}
        loadingTip="Đang tải..."
        menuItems={menuItems}
        userDisplayName={customer?.fullName ?? 'Học viên'}
        avatarUrl={customer?.avatarUrl}
        profileHref="/profile"
        homeHref="/"
        onLogout={handleLogout}
      >
        {children}
      </PortalDashboardShell>
    </GameExitGuardProvider>
  );
}
