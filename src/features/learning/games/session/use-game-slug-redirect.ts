'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { resolveGameSlugRedirect } from '@/features/learning/games/session/game-assignment-route.utils';
import { modeIdFromUrlParam } from '@/features/learning/games/session/game-mode.utils';
import { toGameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';
import type { GameUrlSegment } from '@/features/learning/games/session/game-route.utils';
import { useGameSlug } from '@/features/learning/games/session/GameSlugRouteShell';
import { useGameRouteQuery } from '@/features/learning/games/session/use-game-route-query';

type Props = {
	urlSegment: GameUrlSegment;
	promptType: string | null | undefined;
	enabled: boolean;
};

/** Sau khi fetch assignment/play — redirect sang đúng game slug nếu URL lệch. */
export function useGameSlugRedirect({ urlSegment, promptType, enabled }: Props) {
	const router = useRouter();
	const routeQuery = useGameRouteQuery();
	const gameSlug = useGameSlug();

	useEffect(() => {
		if (!enabled || !promptType) return;

		const href = resolveGameSlugRedirect(
			gameSlug,
			promptType,
			{
				...toGameRouteQuery(routeQuery),
				classId: routeQuery.classId,
				modeId: modeIdFromUrlParam(routeQuery.modeIdParam) ?? undefined,
			},
			urlSegment,
		);

		if (href) {
			router.replace(href);
		}
	}, [enabled, gameSlug, promptType, routeQuery, router, urlSegment]);
}
