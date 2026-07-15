'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { buildDashboardMenuAntdItems } from '@/lib/dashboard-menu';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';

type Props = {
	children: ReactNode;
	sidebarCollapsedDefault?: boolean;
};

/** Chrome HV trên funnel mock-test-online — không redirect khỏi route hiện tại. */
export function CustomerPortalChromeClient({
	children,
	sidebarCollapsedDefault = false,
}: Props) {
	const { customer, ready, logout, refreshSession } = useAuth();
	const router = useRouter();
	const [gateReady, setGateReady] = useState(false);

	useEffect(() => {
		if (!ready) return;
		if (customer) {
			setGateReady(true);
			return;
		}
		void refreshSession().then(() => setGateReady(true));
	}, [ready, customer, refreshSession]);

	const menuItems = useMemo(
		() =>
			buildDashboardMenuAntdItems((path, label) => <Link href={path}>{label}</Link>, {
				classes: [],
			}),
		[],
	);

	const handleLogout = useCallback(() => {
		void logout().then(() => {
			router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
		});
	}, [logout, router]);

	return (
		<PortalDashboardShell
			ready={ready && gateReady && Boolean(customer)}
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
