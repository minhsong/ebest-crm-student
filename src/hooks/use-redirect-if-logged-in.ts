'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalSession } from '@/contexts/portal-session-context';
import { homePathForPortalActor } from '@/lib/portal-auth/portal-session-nav';

/**
 * Trang public (forgot/reset): đã có phiên portal → redirect zone tương ứng.
 */
export function useRedirectIfLoggedIn() {
	const router = useRouter();
	const session = usePortalSession();
	const [shouldHide, setShouldHide] = useState(false);

	useEffect(() => {
		if (session.status === 'loading') return;
		if (session.actor === 'guest') {
			setShouldHide(false);
			return;
		}
		setShouldHide(true);
		router.replace(homePathForPortalActor(session.actor));
	}, [session, router]);

	return {
		ready: session.status === 'ready',
		shouldHide,
	};
}
