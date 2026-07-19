'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PortalDashboardShell } from '@/components/layouts/dashboard';
import { buildLeadPortalMenuAntdItems } from '@/lib/dashboard-menu';
import type { LeadProfile } from '@/lib/lead-portal/types';
import { fetchLeadProfile } from '@/lib/lead-portal/client-api';
import { isLeadPortalUnauthorizedError } from '@/lib/lead-portal/errors';
import { isLeadIdentityUpgraded } from '@/lib/portal-auth/portal-auth-session';
import { usePortalSession } from '@/contexts/portal-session-context';
import {
	buildLeadCompleteProfilePath,
	PORTAL_MOCK_TEST_RESULTS_ROUTES,
} from '@/lib/portal-auth/session-routes';
import {
	PORTAL_MOCK_TEST_ROUTES,
	isLeadIncompleteProfileAllowedPath,
} from '@/features/portal-mock-test/routes.config';
import { PortalExploreProvider } from '@/contexts/portal-explore-context';

const COMPLETE_PROFILE_PATH = '/lead/complete-profile';

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
	const pathname = usePathname();
	const portal = usePortalSession();
	const [ready, setReady] = useState(skipInitialProbe && Boolean(initialProfile));
	const [profile, setProfile] = useState<LeadProfile | null>(initialProfile);
	const onCompleteProfilePath = Boolean(
		pathname?.startsWith(COMPLETE_PROFILE_PATH),
	);

	useEffect(() => {
		if (skipInitialProbe && initialProfile) {
			setProfile(initialProfile);
			setReady(true);
			return;
		}

		if (portal.status !== 'ready') return;

		if (portal.actor === 'customer') {
			router.replace(
				allowMockTestFunnel
					? '/mock-test-online'
					: PORTAL_MOCK_TEST_RESULTS_ROUTES.student,
			);
			return;
		}
		if (portal.actor === 'guest') {
			router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
			return;
		}

		let cancelled = false;
		void (async () => {
			try {
				const next = await fetchLeadProfile();
				if (cancelled) return;
				if (isLeadIdentityUpgraded(next)) {
					await portal.refresh();
					router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.student);
					return;
				}
				if (
					!next.profileCompleted &&
					!pathname?.startsWith(COMPLETE_PROFILE_PATH) &&
					!isLeadIncompleteProfileAllowedPath(pathname ?? '')
				) {
					router.replace(
						buildLeadCompleteProfilePath(
							pathname && pathname !== '/'
								? pathname
								: PORTAL_MOCK_TEST_ROUTES.hub,
						),
					);
					return;
				}
				if (
					next.profileCompleted &&
					pathname?.startsWith(COMPLETE_PROFILE_PATH)
				) {
					router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
					return;
				}
				setProfile(next);
				setReady(true);
			} catch (e) {
				if (cancelled) return;
				if (isLeadPortalUnauthorizedError(e)) {
					router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
					return;
				}
				router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [
		portal,
		router,
		skipInitialProbe,
		initialProfile,
		allowMockTestFunnel,
		pathname,
	]);

	const menuItems = useMemo(
		() =>
			buildLeadPortalMenuAntdItems((path, label) => (
				<Link href={path}>{label}</Link>
			)),
		[],
	);

	const handleLogout = useCallback(() => {
		void portal.logout().then(() => {
			router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
		});
	}, [portal, router]);

	/** Chưa hoàn thiện hồ sơ: chỉ wizard, không mở sidebar layout. */
	if (onCompleteProfilePath) {
		return <>{children}</>;
	}

	return (
		<PortalDashboardShell
			ready={ready && Boolean(profile)}
			loadingTip="Đang tải phiên đăng nhập…"
			menuItems={menuItems}
			userDisplayName={
				profile
					? resolveLeadDisplayName(profile)
					: portal.status === 'ready' && portal.actor === 'lead'
						? portal.displayName
						: 'Thí sinh'
			}
			profileHref="/lead/profile"
			homeHref={PORTAL_MOCK_TEST_ROUTES.hub}
			onLogout={handleLogout}
			defaultSidebarCollapsed={sidebarCollapsedDefault}
		>
			{children}
		</PortalDashboardShell>
	);
}

/**
 * Layout đăng nhập đầy đủ cho lead — cùng chrome dashboard (header + sidebar).
 * Gate: chưa `profileCompleted` → complete-profile, trừ exam.start/resume.
 */
export function LeadAuthenticatedLayoutClient(props: Props) {
	return (
		<PortalExploreProvider>
			<LeadAuthenticatedLayoutInner {...props} />
		</PortalExploreProvider>
	);
}
