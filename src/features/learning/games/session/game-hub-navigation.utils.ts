import { vocabularyGameAssignmentsHref } from '@/features/learning/utils/vocabulary-session-routes';

type BackLinkInput = {
	checklistId?: number | null;
	assignmentId?: number | null;
};

export function getGameHubBackHref({ checklistId, assignmentId }: BackLinkInput): string {
	if (checklistId) return '/classes';
	if (assignmentId) return vocabularyGameAssignmentsHref();
	return '/learning/games';
}

export function getGameHubBackLabel({ checklistId, assignmentId }: BackLinkInput): string {
	if (checklistId) return 'Về checklist';
	if (assignmentId) return 'Về bài tập';
	return 'Game khác';
}
