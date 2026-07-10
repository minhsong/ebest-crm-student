'use client';

import { Suspense } from 'react';
import { useParams, notFound } from 'next/navigation';

import { isValidGameSlug } from '@/features/learning/games/catalog/game-catalog.registry';
import { GameSlugRouteShell } from '@/features/learning/games/session/GameSlugRouteShell';
import type { GameUrlSegment } from '@/features/learning/games/session/game-route.utils';

type Props = {
	urlSegment: GameUrlSegment;
	children: React.ReactNode;
	fallback?: React.ReactNode;
};

function GameSlugSegmentPageInner({ urlSegment, children }: Props) {
	const params = useParams();
	const raw = params.gameSlug;
	const gameSlug = String(Array.isArray(raw) ? raw[0] : raw);

	if (!isValidGameSlug(gameSlug)) {
		notFound();
	}

	return (
		<GameSlugRouteShell gameSlug={gameSlug} urlSegment={urlSegment}>
			{children}
		</GameSlugRouteShell>
	);
}

export function GameSlugSegmentPage({ urlSegment, children, fallback = null }: Props) {
	return (
		<Suspense fallback={fallback}>
			<GameSlugSegmentPageInner urlSegment={urlSegment}>{children}</GameSlugSegmentPageInner>
		</Suspense>
	);
}
