'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from 'antd';

import { GameCatalogView } from '@/features/learning/games/catalog-ui/GameCatalogView';
import { resolveLegacyGamesUrl } from '@/features/learning/games/session/game-route.utils';

function LearningGamesRouteEntryInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [resolving, setResolving] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const syncHref = resolveLegacyGamesUrl(searchParams);
		if (syncHref) {
			router.replace(syncHref);
		}

		if (!cancelled) setResolving(false);

		return () => {
			cancelled = true;
		};
	}, [router, searchParams]);

	if (resolving && resolveLegacyGamesUrl(searchParams)) {
		return <Skeleton active className="p-4" paragraph={{ rows: 4 }} />;
	}

	return <GameCatalogView />;
}

export function LearningGamesRouteEntry() {
	return (
		<Suspense fallback={<Skeleton active className="p-4" />}>
			<LearningGamesRouteEntryInner />
		</Suspense>
	);
}
