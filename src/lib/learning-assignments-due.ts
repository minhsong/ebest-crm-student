import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import type { OverviewClassSessions } from '@/types/overview-sessions';

export interface LearningAssignmentDue {
	assignmentId: number;
	classId: number;
	title: string;
	deadline: string;
	className: string;
	sessionTitle: string;
	resultStatus: number | null;
	exerciseType: string | null;
}

const MS_DAY = 24 * 60 * 60 * 1000;

function isPending(resultStatus: number | null): boolean {
	return (
		resultStatus === null ||
		resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.PENDING
	);
}

/**
 * Lấy bài có deadline trong 7 ngày tới (kèm quá hạn chưa nộp ≤ 3 ngày).
 */
export function extractAssignmentsDue(
	blocks: OverviewClassSessions[],
	maxItems = 5,
	options?: { exerciseType?: string | null },
): LearningAssignmentDue[] {
	const now = Date.now();
	const horizon = now + 7 * MS_DAY;
	const overdueGrace = now - 3 * MS_DAY;
	const items: Array<LearningAssignmentDue & { deadlineMs: number }> = [];

	for (const block of blocks) {
		if (block.canInteract === false) continue;
		for (const session of block.sessions ?? []) {
			for (const assignment of session.assignments ?? []) {
				if (!assignment.deadline || !isPending(assignment.resultStatus ?? null)) {
					continue;
				}
				const exerciseType = assignment.exerciseType ?? null;
				if (
					options?.exerciseType != null &&
					exerciseType !== options.exerciseType
				) {
					continue;
				}
				const deadlineMs = new Date(assignment.deadline).getTime();
				if (Number.isNaN(deadlineMs)) continue;
				if (deadlineMs > horizon) continue;
				if (deadlineMs < overdueGrace) continue;

				items.push({
					assignmentId: assignment.assignmentId,
					classId: block.classId,
					title: assignment.title,
					deadline: assignment.deadline,
					className: block.className,
					sessionTitle: session.title,
					resultStatus: assignment.resultStatus ?? null,
					exerciseType,
					deadlineMs,
				});
			}
		}
	}

	return items
		.sort((a, b) => a.deadlineMs - b.deadlineMs)
		.slice(0, maxItems)
		.map(({ deadlineMs: _deadlineMs, ...rest }) => rest);
}

export function formatAssignmentDeadline(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}
