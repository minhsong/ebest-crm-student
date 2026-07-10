import type { GameRouteQuery } from '@/features/learning/games/session/game-route.utils';

export type ParsedGameRouteQuery = {
	classId: number | null;
	assignmentId: number | null;
	checklistId: number | null;
	playId: string | null;
	modeIdParam: string | null;
	classSessionId: number | null;
};

function parseOptionalInt(raw: string | null): number | null {
	if (!raw) return null;
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

export function parseGameRouteQuery(searchParams: URLSearchParams): ParsedGameRouteQuery {
	return {
		classId: parseOptionalInt(searchParams.get('classId')),
		assignmentId: parseOptionalInt(searchParams.get('assignmentId')),
		checklistId: parseOptionalInt(searchParams.get('checklistId')),
		playId: searchParams.get('playId'),
		modeIdParam: searchParams.get('modeId'),
		classSessionId: parseOptionalInt(searchParams.get('classSessionId')),
	};
}

/** Query chung cho build href playing/result/ready. */
export function toGameRouteQuery(input: ParsedGameRouteQuery & { modeId?: string | null }): GameRouteQuery {
	return {
		classId: input.classId,
		assignmentId: input.assignmentId,
		checklistId: input.checklistId,
		playId: input.playId,
		modeId: input.modeId ?? null,
		classSessionId: input.classSessionId ?? null,
	};
}
