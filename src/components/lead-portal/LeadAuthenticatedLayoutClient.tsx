'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { buildLeadPortalMenuAntdItems } from '@/lib/dashboard-menu';
import type { LeadProfile } from '@/lib/lead-portal/types';
import { probePortalSession } from '@/lib/portal-auth/probe-portal-session';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';
import { LeadMarketingStrip } from '@/components/lead-portal/LeadMarketingStrip';
import { usePortalSiteLinks } from '@/hooks/use-portal-site-links';
import { PortalExploreProvider } from '@/contexts/portal-explore-context';

function resolveLeadDisplayName(profile: LeadProfile): string {
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
  initialProfile?: LeadProfile | null;
  skipInitialProbe?: boolean;
  allowMockTestFunnel?: boolean;
  sidebarCollapsedDefault?: boolean;
};

function LeadAuthenticatedLayoutInner({
  children,
  initialProfile = null,
  skipInitialProbe = false,
  allowMockTestFunnel = false,
  sidebarCollapsedDefault = false,
}: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(skipInitialProbe && Boolean(initialProfile));
  const [profile, setProfile] = useState<LeadProfile | null>(initialProfile);
  const { siteLinks } = usePortalSiteLinks();

  useEffect(() => {
    if (skipInitialProbe && initialProfile) {
      setProfile(initialProfile);
      setReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const probe = await probePortalSession();
      if (cancelled) return;
      if (probe.kind === 'student') {
        if (allowMockTestFunnel) {
          router.replace('/mock-test-online');
          return;
        }
        router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.student);
        return;
      }
      if (probe.kind === 'none') {
        router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
        return;
      }
      setProfile(probe.profile);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, skipInitialProbe, initialProfile, allowMockTestFunnel]);

  const menuItems = useMemo(
    () =>
      buildLeadPortalMenuAntdItems((path, label) => (
        <Link href={path}>{label}</Link>
      )),
    [],
  );

  const handleLogout = useCallback(() => {
    void (async () => {
      await fetch('/api/auth/portal/logout', { method: 'POST' });
      router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
    })();
  }, [router]);

  return (
    <PortalDashboardShell
      ready={ready && Boolean(profile)}
      loadingTip="Đang tải phiên đăng nhập…"
      menuItems={menuItems}
      userDisplayName={profile ? resolveLeadDisplayName(profile) : 'Thí sinh'}
      profileHref="/lead/profile"
      homeHref={PORTAL_MOCK_TEST_RESULTS_ROUTES.lead}
      onLogout={handleLogout}
      defaultSidebarCollapsed={sidebarCollapsedDefault}
    >
      <LeadMarketingStrip siteLinks={siteLinks} />
      {children}
    </PortalDashboardShell>
  );
}

/**
 * Layout đăng nhập đầy đủ cho lead — cùng chrome dashboard (header + sidebar).
 * `PortalExploreProvider`: 1 fetch explore cho strip + trang courses.
 */
export function LeadAuthenticatedLayoutClient(props: Props) {
  return (
    <PortalExploreProvider>
      <LeadAuthenticatedLayoutInner {...props} />
    </PortalExploreProvider>
  );
}
