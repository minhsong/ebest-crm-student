'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';

import type { GameCatalogEntry } from '@/features/learning/games/catalog/game-catalog.types';
import { resolveGameSlugFromPromptType } from '@/features/learning/games/catalog/game-catalog.registry';
import { modeIdFromUrlParam } from '@/features/learning/games/session/game-mode.utils';
import { reconcileGameRoute } from '@/features/learning/games/session/game-route-reconcile.utils';
import type { GameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';
import {
	buildGamePlayingHref,
	buildGameReadyHref,
	buildGameResultHref,
	type GameUrlSegment,
} from '@/features/learning/games/session/game-route.utils';
import { abandonDrillSession, fetchDrillSession, isDrillPlayId } from '@/lib/learning-api';
import type { DrillSessionResumePayload } from '@/types/learning';

type Options = {
	gameSlug: string;
	urlSegment: GameUrlSegment;
	routeQuery: GameRouteQuery;
	catalogEntry: GameCatalogEntry | undefined;
};

export function useGameRouteReconcile({
	gameSlug,
	urlSegment,
	routeQuery,
	catalogEntry,
}: Options) {
	const router = useRouter();
	const { classId, playId } = routeQuery;

	const [loading, setLoading] = useState(true);
	const [play, setPlay] = useState<DrillSessionResumePayload | null>(null);
	const [confirmContinue, setConfirmContinue] = useState(false);

	const readyHref = useMemo(
		() =>
			buildGameReadyHref(gameSlug, {
				classId: routeQuery.classId,
				assignmentId: routeQuery.assignmentId,
				checklistId: routeQuery.checklistId,
				modeId: modeIdFromUrlParam(routeQuery.modeIdParam) ?? 'survival',
			}),
		[gameSlug, routeQuery],
	);

	const playRouteParams = useMemo(
		() => ({
			classId: routeQuery.classId,
			assignmentId: routeQuery.assignmentId,
			checklistId: routeQuery.checklistId,
			modeId: modeIdFromUrlParam(routeQuery.modeIdParam) ?? undefined,
		}),
		[routeQuery],
	);

	const runReconcile = useCallback(async () => {
		if (!catalogEntry) {
			router.replace('/learning/games');
			return;
		}

		setLoading(true);
		let loadedPlay: DrillSessionResumePayload | null = null;

		if (playId) {
			if (!isDrillPlayId(playId)) {
				router.replace(readyHref);
				return;
			}
			try {
				loadedPlay = await fetchDrillSession(playId);
			} catch {
				message.error('Không tìm thấy lượt chơi hoặc lượt đã hết hạn.');
				router.replace(readyHref);
				return;
			}
		}

		const outcome = reconcileGameRoute({
			gameSlug,
			urlSegment,
			playId,
			classId,
			play: loadedPlay,
		});

		if (outcome.kind === 'redirect') {
			router.replace(outcome.href);
			return;
		}

		if (outcome.kind === 'invalid') {
			router.replace(readyHref);
			return;
		}

		if (outcome.kind === 'confirm_continue') {
			setPlay(loadedPlay);
			setConfirmContinue(true);
			setLoading(false);
			return;
		}

		setPlay(loadedPlay);
		setConfirmContinue(false);
		setLoading(false);
	}, [catalogEntry, classId, gameSlug, playId, readyHref, router, urlSegment]);

	useEffect(() => {
		void runReconcile();
	}, [runReconcile]);

	const handleContinuePlay = useCallback(() => {
		if (!play) return;
		setConfirmContinue(false);
		const slug = resolveGameSlugFromPromptType(play.promptType);
		router.replace(
			buildGamePlayingHref(slug, {
				...playRouteParams,
				playId: play.playId,
				classId: classId ?? play.classId,
				assignmentId: play.assignmentId,
				modeId: play.modeId,
			}),
		);
	}, [classId, play, playRouteParams, router]);

	const handleDismissContinue = useCallback(() => {
		setConfirmContinue(false);
		setPlay(null);
		router.replace(readyHref);
	}, [readyHref, router]);

	const handleAbandonAndStay = useCallback(async () => {
		if (!play?.playId) {
			setConfirmContinue(false);
			router.replace(readyHref);
			return;
		}
		try {
			await abandonDrillSession(play.playId, { treatNotFoundAsSuccess: true });
			setConfirmContinue(false);
			const slug = resolveGameSlugFromPromptType(play.promptType);
			if (urlSegment === 'result') {
				router.replace(
					buildGameResultHref(slug, {
						...playRouteParams,
						playId: play.playId,
						classId: classId ?? play.classId,
					}),
				);
				return;
			}
			message.success('Đã kết thúc lượt chơi.');
			router.replace(
				buildGameReadyHref(slug, {
					...playRouteParams,
					classId: classId ?? play.classId,
				}),
			);
		} catch {
			message.error('Không kết thúc được lượt chơi. Vui lòng thử lại.');
		}
	}, [classId, play, playRouteParams, readyHref, router, urlSegment]);

	return {
		loading,
		play,
		confirmContinue,
		readyHref,
		reconciled: !confirmContinue,
		handleContinuePlay,
		handleDismissContinue,
		handleAbandonAndStay,
	};
}
