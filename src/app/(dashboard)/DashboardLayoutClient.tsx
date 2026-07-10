'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { GameExitGuardProvider } from '@/features/learning/games/session/game-exit-guard.context';
import { buildDashboardMenuAntdItems } from '@/lib/dashboard-menu';
import { probePortalSession } from '@/lib/portal-auth/probe-portal-session';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';

export default function DashboardLayoutClient({
  children,
  initialClasses,
}: {
  children: React.ReactNode;
  initialClasses?: Array<{ id: number; name: string; status?: string | null }> | null;
}) {
  const { customer, ready, logout, refreshSession } = useAuth();
  const router = useRouter();
  const [gateReady, setGateReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (customer) {
      setGateReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const probe = await probePortalSession();
      if (cancelled) return;
      if (probe.kind === 'lead') {
        router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
        return;
      }
      if (probe.kind === 'student') {
        await refreshSession();
        if (!cancelled) setGateReady(true);
        return;
      }
      router.replace('/login');
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, customer, router, refreshSession]);

  const menuItems = useMemo(
    () =>
      buildDashboardMenuAntdItems((path, label) => <Link href={path}>{label}</Link>, {
        classes: initialClasses ?? [],
      }),
    [initialClasses],
  );

  const handleLogout = () => {
    void logout();
    router.replace('/login');
  };

  return (
    <GameExitGuardProvider>
      <PortalDashboardShell
        ready={ready && gateReady && Boolean(customer)}
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
