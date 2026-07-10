'use client';

import { createContext, useContext } from 'react';

import type { GameUrlSegment } from '@/features/learning/games/session/game-route.utils';
import type { DrillSessionResumePayload } from '@/types/learning';

export type GameRouteContextValue = {
	gameSlug: string;
	urlSegment: GameUrlSegment;
	play: DrillSessionResumePayload | null;
	reconciled: boolean;
};

const GameRouteContext = createContext<GameRouteContextValue | null>(null);

export function GameRouteContextProvider({
	value,
	children,
}: {
	value: GameRouteContextValue;
	children: React.ReactNode;
}) {
	return <GameRouteContext.Provider value={value}>{children}</GameRouteContext.Provider>;
}

export function useGameRouteContext(): GameRouteContextValue {
	const ctx = useContext(GameRouteContext);
	if (!ctx) {
		throw new Error('useGameRouteContext must be used within GameSlugRouteShell');
	}
	return ctx;
}

export function useGameSlug(): string {
	return useGameRouteContext().gameSlug;
}
