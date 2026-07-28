'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { usePortalSession } from '@/contexts/portal-session-context';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { buildDashboardMenuAntdItems } from '@/lib/dashboard-menu';
import {
  getCustomerClassesFromPortalSession,
  getCustomerFromPortalSession,
  isCustomerPortalShellReady,
} from '@/lib/portal-auth/portal-session-selectors';

type Props = {
  children: ReactNode;
  sidebarCollapsedDefault?: boolean;
};

/** Chrome HV trên funnel mock-test — logout SSOT qua PortalSession (hard navigate). */
export function CustomerPortalChromeClient({
  children,
  sidebarCollapsedDefault = false,
}: Props) {
  const { logout } = useAuth();
  const portal = usePortalSession();

  const customer = getCustomerFromPortalSession(portal);
  const shellReady = isCustomerPortalShellReady(portal);

  const menuItems = useMemo(
    () =>
      buildDashboardMenuAntdItems((path, label) => <Link href={path}>{label}</Link>, {
        classes: getCustomerClassesFromPortalSession(portal),
      }),
    [portal],
  );

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  return (
    <PortalDashboardShell
      ready={shellReady}
      loadingTip="Đang tải phiên đăng nhập…"
      menuItems={menuItems}
      userDisplayName={customer?.fullName ?? 'Học viên'}
      avatarUrl={customer?.avatarUrl}
      profileHref="/profile"
      homeHref="/"
      onLogout={handleLogout}
      defaultSidebarCollapsed={sidebarCollapsedDefault}
    >
      {children}
    </PortalDashboardShell>
  );
}
