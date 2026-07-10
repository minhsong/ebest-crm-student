/** API / engine mode id */
export type GameModeApiId = 'survival' | 'pool_coverage' | 'speed_run';

/** Mode id trên URL — `best_of` là alias product của `pool_coverage`. */
export type GameModeUrlId = GameModeApiId | 'best_of';

/** Parse `modeId` query → id engine. */
export function modeIdFromUrlParam(param: string | null | undefined): GameModeApiId | null {
	if (!param) return null;
	if (param === 'survival' || param === 'pool_coverage' || param === 'speed_run') return param;
	if (param === 'best_of') return 'pool_coverage';
	return null;
}

/** Serialize mode cho URL (product copy). */
export function modeIdToUrlParam(modeId: string | null | undefined): string | null {
	if (!modeId) return null;
	if (modeId === 'survival') return 'survival';
	if (modeId === 'speed_run') return 'speed_run';
	if (modeId === 'pool_coverage' || modeId === 'best_of') return 'best_of';
	return modeId;
}

export function normalizeModeIdForApi(modeId: string | null | undefined): GameModeApiId {
	return modeIdFromUrlParam(modeId) ?? 'survival';
}
