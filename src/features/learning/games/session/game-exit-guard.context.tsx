'use client';

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

export type GameExitGuardHandle = {
	enabled: boolean;
	confirmExit: (navigate: () => void) => void;
};

type GameExitGuardContextValue = {
	register: (handle: GameExitGuardHandle | null) => void;
};

const GameExitGuardContext = createContext<GameExitGuardContextValue | null>(null);

export function isInternalGameNavigationHref(href: string): boolean {
	if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
		return false;
	}
	if (href.startsWith('http://') || href.startsWith('https://')) {
		try {
			const url = new URL(href);
			return url.origin === window.location.origin;
		} catch {
			return false;
		}
	}
	return href.startsWith('/');
}

/** E11 — chặn `<Link>` sidebar/menu khi đang playing. */
export function GameExitGuardProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const guardRef = useRef<GameExitGuardHandle | null>(null);

	const register = useCallback((handle: GameExitGuardHandle | null) => {
		guardRef.current = handle;
	}, []);

	useEffect(() => {
		const onClickCapture = (event: MouseEvent) => {
			const guard = guardRef.current;
			if (!guard?.enabled) return;

			const target = event.target;
			if (!(target instanceof Element)) return;

			const anchor = target.closest('a[href]');
			if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
			if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

			const href = anchor.getAttribute('href');
			if (!href || !isInternalGameNavigationHref(href)) return;

			const destination = new URL(href, window.location.href);
			const current = new URL(window.location.href);
			if (
				destination.pathname === current.pathname &&
				destination.search === current.search
			) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			guard.confirmExit(() => {
				router.push(`${destination.pathname}${destination.search}${destination.hash}`);
			});
		};

		document.addEventListener('click', onClickCapture, true);
		return () => document.removeEventListener('click', onClickCapture, true);
	}, [router]);

	const value = useMemo(() => ({ register }), [register]);

	return (
		<GameExitGuardContext.Provider value={value}>{children}</GameExitGuardContext.Provider>
	);
}

export function useGameExitGuardContext(): GameExitGuardContextValue {
	const ctx = useContext(GameExitGuardContext);
	if (!ctx) {
		throw new Error('useGameExitGuardContext must be used within GameExitGuardProvider');
	}
	return ctx;
}

/** Đăng ký guard từ GamePlayingView — optional nếu provider chưa mount. */
export function useOptionalGameExitGuardContext(): GameExitGuardContextValue | null {
	return useContext(GameExitGuardContext);
}
