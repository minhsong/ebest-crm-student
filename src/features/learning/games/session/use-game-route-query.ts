'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { parseGameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';

export function useGameRouteQuery() {
	const searchParams = useSearchParams();
	return useMemo(() => parseGameRouteQuery(searchParams), [searchParams]);
}
