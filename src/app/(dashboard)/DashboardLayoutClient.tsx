'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { usePortalSession } from '@/contexts/portal-session-context';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { GameExitGuardProvider } from '@/features/learning/games/session/game-exit-guard.context';
import { buildDashboardMenuAntdItems } from '@/lib/dashboard-menu';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';

export default function DashboardLayoutClient({
	children,
	initialClasses,
}: {
	children: React.ReactNode;
	initialClasses?: Array<{ id: number; name: string; status?: string | null }> | null;
}) {
	const { customer, ready, logout, refreshSession } = useAuth();
	const portal = usePortalSession();
	const router = useRouter();
	const [gateReady, setGateReady] = useState(false);

	useEffect(() => {
		if (!ready || portal.status !== 'ready') return;

		if (portal.actor === 'lead') {
			router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
			return;
		}
		if (portal.actor === 'guest') {
			router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
			return;
		}

		if (customer) {
			setGateReady(true);
			return;
		}

		let cancelled = false;
		void refreshSession().then(() => {
			if (!cancelled) setGateReady(true);
		});
		return () => {
			cancelled = true;
		};
	}, [
		portal,
		ready,
		customer,
		router,
		refreshSession,
	]);

	const menuItems = useMemo(
		() =>
			buildDashboardMenuAntdItems((path, label) => <Link href={path}>{label}</Link>, {
				classes: initialClasses ?? [],
			}),
		[initialClasses],
	);

	const handleLogout = () => {
		void logout().then(() => {
			router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
		});
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
