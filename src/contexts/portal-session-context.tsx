'use client';

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import type { ClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import {
	fetchClientPortalSession,
	portalLogoutClient,
} from '@/lib/portal-auth/portal-session.client';

export type PortalSessionReadyState =
	| { status: 'ready'; actor: 'guest' }
	| { status: 'ready'; actor: 'customer'; displayName: string }
	| { status: 'ready'; actor: 'lead'; displayName: string };

export type PortalSessionState =
	| { status: 'loading' }
	| PortalSessionReadyState;

type PortalSessionContextValue = PortalSessionState & {
	refresh: () => Promise<PortalSessionReadyState>;
	logout: () => Promise<void>;
	/** Gán lại sau login mà không cần round-trip (optional). */
	setFromPayload: (payload: ClientPortalSessionPayload) => void;
};

const PortalSessionContext = createContext<PortalSessionContextValue | null>(
	null,
);

function toReadyState(
	data: ClientPortalSessionPayload,
): PortalSessionReadyState {
	if (data.actor === 'customer') {
		return {
			status: 'ready',
			actor: 'customer',
			displayName: data.displayName?.trim() || 'Học viên',
		};
	}
	if (data.actor === 'lead') {
		return {
			status: 'ready',
			actor: 'lead',
			displayName: data.displayName?.trim() || 'Thí sinh',
		};
	}
	return { status: 'ready', actor: 'guest' };
}

export function PortalSessionProvider({
	children,
	initialSession,
}: {
	children: React.ReactNode;
	/** SSR seed từ `resolvePortalSessionFromCookies` — tránh flash gate. */
	initialSession?: ClientPortalSessionPayload | null;
}) {
	const [state, setState] = useState<PortalSessionState>(() =>
		initialSession != null
			? toReadyState(initialSession)
			: { status: 'loading' },
	);

	const setFromPayload = useCallback((payload: ClientPortalSessionPayload) => {
		setState(toReadyState(payload));
	}, []);

	const refresh = useCallback(async () => {
		const data = await fetchClientPortalSession();
		const next = toReadyState(data);
		setState(next);
		return next;
	}, []);

	const logout = useCallback(async () => {
		await portalLogoutClient();
		setState({ status: 'ready', actor: 'guest' });
	}, []);

	useEffect(() => {
		if (initialSession != null) return;
		void refresh();
	}, [initialSession, refresh]);

	const value = useMemo<PortalSessionContextValue>(
		() => ({
			...state,
			refresh,
			logout,
			setFromPayload,
		}),
		[state, refresh, logout, setFromPayload],
	);

	return (
		<PortalSessionContext.Provider value={value}>
			{children}
		</PortalSessionContext.Provider>
	);
}

export function usePortalSession(): PortalSessionContextValue {
	const ctx = useContext(PortalSessionContext);
	if (!ctx) {
		throw new Error('usePortalSession must be used within PortalSessionProvider');
	}
	return ctx;
}

/** Narrow helper — chỉ gọi khi đã biết status !== loading. */
export function getPortalActor(
	session: PortalSessionState,
): 'guest' | 'customer' | 'lead' | null {
	if (session.status === 'loading') return null;
	return session.actor;
}
