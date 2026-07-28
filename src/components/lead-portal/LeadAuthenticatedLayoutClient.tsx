'use client';

import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { buildLeadPortalMenuAntdItems } from '@/lib/dashboard-menu';
import type { PortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';
import { useAuth } from '@/contexts/auth-context';
import { usePortalSession } from '@/contexts/portal-session-context';
import {
  getLeadSessionSummary,
  getPortalActor,
  isPortalSessionReady,
} from '@/lib/portal-auth/portal-session-selectors';
import { isLeadCompleteProfilePath } from '@/lib/portal-auth/session-routes';
import {
  PORTAL_MOCK_TEST_ROUTES,
  isPortalMockTestFunnelPath,
} from '@/features/portal-mock-test/routes.config';
import { MockTestOnlineSiteLayout } from '@/components/public-mock-test-online/MockTestOnlineSiteLayout';
import { LoadingState } from '@/components/layout';
import { PortalExploreProvider } from '@/contexts/portal-explore-context';
import { resolveLeadNavigation } from '@/lib/portal-auth/resolve-lead-navigation';

function resolveLeadDisplayName(profile: PortalLeadSessionSummary): string {
  const name = profile.displayName?.trim();
  if (name) return name;
  const phone = profile.phoneE164?.trim();
  if (phone) return phone;
  const email = profile.email?.trim();
  if (email && !email.endsWith('@mto.ebest.internal')) return email;
  return 'Thí sinh';
}

type Props = {
  children: ReactNode;
  allowMockTestFunnel?: boolean;
  sidebarCollapsedDefault?: boolean;
};

function LeadAuthenticatedLayoutInner({
  children,
  allowMockTestFunnel = false,
  sidebarCollapsedDefault = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const portal = usePortalSession();
  const portalReady = isPortalSessionReady(portal);
  const actor = getPortalActor(portal);
  const profile = getLeadSessionSummary(portal);
  const onCompleteProfilePath = isLeadCompleteProfilePath(pathname);

  useEffect(() => {
    if (!portalReady) return;

    const nav = resolveLeadNavigation({
      actor: actor ?? 'guest',
      profile,
      currentPath: pathname,
      allowMockTestFunnel,
      mode: 'layout',
    });
    if (nav.action === 'redirect') {
      router.replace(nav.destination);
    }
  }, [portalReady, actor, profile, pathname, allowMockTestFunnel, router]);

  const menuItems = useMemo(
    () =>
      buildLeadPortalMenuAntdItems((path, label) => (
        <Link href={path}>{label}</Link>
      )),
    [],
  );

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  if (onCompleteProfilePath) {
    return <>{children}</>;
  }

  if (!portalReady || actor === 'guest') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <LoadingState tip="Đang tải phiên đăng nhập…" />
      </div>
    );
  }

  const onFunnelPath = isPortalMockTestFunnelPath(pathname ?? '');
  const profileIncomplete = profile != null && !profile.profileCompleted;
  if (onFunnelPath && (profile == null || profileIncomplete)) {
    return <MockTestOnlineSiteLayout>{children}</MockTestOnlineSiteLayout>;
  }
  if (profileIncomplete) {
    return <>{children}</>;
  }
  if (profile == null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <LoadingState tip="Đang tải phiên đăng nhập…" />
      </div>
    );
  }

  return (
    <PortalDashboardShell
      ready
      loadingTip="Đang tải phiên đăng nhập…"
      menuItems={menuItems}
      userDisplayName={resolveLeadDisplayName(profile)}
      profileHref="/lead/profile"
      homeHref={PORTAL_MOCK_TEST_ROUTES.hub}
      onLogout={handleLogout}
      defaultSidebarCollapsed={sidebarCollapsedDefault}
    >
      {children}
    </PortalDashboardShell>
  );
}

export function LeadAuthenticatedLayoutClient(props: Props) {
  return (
    <PortalExploreProvider>
      <LeadAuthenticatedLayoutInner {...props} />
    </PortalExploreProvider>
  );
}
