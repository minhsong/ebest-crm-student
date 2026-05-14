import type { QuizAssignmentListItem } from '@/features/quiz-test/types';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import type { OverviewClassSessions } from '@/types/overview-sessions';

export const EXERCISE_TYPE_QUIZ = 'quiz';

export function isQuizExerciseType(exerciseType: unknown): boolean {
  return String(exerciseType ?? '').trim().toLowerCase() === EXERCISE_TYPE_QUIZ;
}

export function formatAssignmentDeadlineVi(deadlineIso: string | null): string | null {
  if (!deadlineIso) return null;
  const ts = new Date(deadlineIso);
  if (Number.isNaN(ts.getTime())) return null;
  return ts.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sortQuizAssignmentListItems(
  items: QuizAssignmentListItem[],
): QuizAssignmentListItem[] {
  return [...items].sort((a, b) => {
    const aDone = a.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED;
    const bDone = b.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED;
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.assignmentId - b.assignmentId;
  });
}

/**
 * Gom danh sách bài QUIZ từ payload overview (1 request) — không gọi N lần assignment detail.
 * Mỗi `assignmentId` chỉ một dòng (buổi đầu gặp trong duyệt lớp → buổi).
 */
export function buildQuizAssignmentListFromOverview(
  overviewBlocks: OverviewClassSessions[],
): { items: QuizAssignmentListItem[]; missingLinkedQuizCount: number } {
  const seen = new Map<number, QuizAssignmentListItem>();
  let missingLinkedQuizCount = 0;

  for (const block of overviewBlocks) {
    for (const session of block.sessions ?? []) {
      const sessionTitle = session.title ?? null;
      for (const a of session.assignments ?? []) {
        const id = a.assignmentId;
        if (!Number.isFinite(id)) continue;
        if (!isQuizExerciseType(a.exerciseType)) continue;
        if (seen.has(id)) continue;

        const publicId = (a.testQuizFormPublicId ?? '').trim();
        if (!publicId) {
          missingLinkedQuizCount += 1;
          continue;
        }

        const title = (a.title ?? '').trim() || 'Bài trắc nghiệm';
        seen.set(id, {
          assignmentId: id,
          assignmentTitle: title,
          formPublicId: publicId,
          scoreDisplay: a.scoreDisplay ?? null,
          resultStatus: a.resultStatus ?? null,
          deadline: a.deadline ?? null,
          sessionTitle,
          quizMaxAttempts:
            typeof a.quizMaxAttempts === 'number' ? a.quizMaxAttempts : null,
        });
      }
    }
  }

  return {
    items: sortQuizAssignmentListItems([...seen.values()]),
    missingLinkedQuizCount,
  };
}

export function collectFormPublicIdsForProgress(
  assignmentRows: QuizAssignmentListItem[],
): string[] {
  const ids = new Set<string>();
  for (const row of assignmentRows) {
    if (row.formPublicId) ids.add(row.formPublicId);
  }
  return [...ids];
}
