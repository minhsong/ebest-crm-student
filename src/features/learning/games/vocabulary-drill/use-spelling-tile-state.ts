import type { SpellingTile } from '@ebest/game-vocabulary-drill';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type { SpellingTile };

/** SP-04/SP-05 — pool slots cố định; đáp án theo thứ tự tap (SPELLING_GAME_SPEC §5.2). */
export function useSpellingTileState(
	questionId: string,
	tiles: SpellingTile[],
	optionsLocked: boolean,
) {
	const tileById = useMemo(
		() => new Map(tiles.map((tile) => [tile.tileId, tile])),
		[tiles],
	);

	const slotTileIds = useMemo(() => tiles.map((tile) => tile.tileId), [tiles]);
	const [answerTileIds, setAnswerTileIds] = useState<string[]>([]);
	const answerTileIdsRef = useRef<string[]>([]);

	const answerSet = useMemo(() => new Set(answerTileIds), [answerTileIds]);

	const syncAnswerTiles = useCallback((next: string[]) => {
		answerTileIdsRef.current = next;
	}, []);

	useEffect(() => {
		setAnswerTileIds([]);
		syncAnswerTiles([]);
	}, [questionId, syncAnswerTiles]);

	const getAnswerTileIds = useCallback(() => [...answerTileIdsRef.current], []);

	const moveToAnswer = useCallback(
		(tileId: string) => {
			if (optionsLocked || answerSet.has(tileId)) return;
			setAnswerTileIds((prev) => {
				const next = [...prev, tileId];
				syncAnswerTiles(next);
				return next;
			});
		},
		[answerSet, optionsLocked, syncAnswerTiles],
	);

	const moveToPool = useCallback(
		(tileId: string) => {
			if (optionsLocked) return;
			setAnswerTileIds((prev) => {
				const next = prev.filter((id) => id !== tileId);
				syncAnswerTiles(next);
				return next;
			});
		},
		[optionsLocked, syncAnswerTiles],
	);

	return {
		tileById,
		slotTileIds,
		answerTileIds,
		answerSet,
		moveToAnswer,
		moveToPool,
		getAnswerTileIds,
	};
}
