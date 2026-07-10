'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from 'antd';

import { isValidGameSlug } from '@/features/learning/games/catalog/game-catalog.registry';
import { buildGameReadyHref } from '@/features/learning/games/session/game-route.utils';

/** Redirect `/learning/games/[slug]` → `/ready`. */
export default function GameSlugIndexPage() {
	const params = useParams();
	const router = useRouter();
	const raw = params.gameSlug;
	const gameSlug = String(Array.isArray(raw) ? raw[0] : raw);

	useEffect(() => {
		if (!isValidGameSlug(gameSlug)) {
			router.replace('/learning/games');
			return;
		}
		router.replace(buildGameReadyHref(gameSlug));
	}, [gameSlug, router]);

	return <Skeleton active className="p-4" paragraph={{ rows: 3 }} />;
}
