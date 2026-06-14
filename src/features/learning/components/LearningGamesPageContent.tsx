'use client';

import { useSearchParams } from 'next/navigation';
import { DrillPracticeView } from '@/features/learning/components/DrillPracticeView';
import { GamesDashboardView } from '@/features/learning/components/GamesDashboardView';

function hasPracticeContext(searchParams: URLSearchParams): boolean {
	if (searchParams.get('playId')) return true;

	const assignmentId = searchParams.get('assignmentId');
	if (assignmentId && !Number.isNaN(Number(assignmentId))) return true;

	const classId = searchParams.get('classId');
	if (classId && !Number.isNaN(Number(classId))) return true;

	return false;
}

/** `/learning/games` — dashboard hoặc lobby/play khi URL có classId / assignmentId / playId. */
export function LearningGamesPageContent() {
	const searchParams = useSearchParams();

	if (hasPracticeContext(searchParams)) {
		return <DrillPracticeView />;
	}

	return <GamesDashboardView />;
}
