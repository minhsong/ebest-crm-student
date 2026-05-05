import type { QuizAssignmentListItem } from '@/features/quiz-test/types';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import type { StudentAssignmentDetail } from '@/types/student-assignment-detail';
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

export type QuizOverviewCandidate = {
  assignmentId: number;
  title: string;
  sessionTitle: string | null;
};

/**
 * Gom assignment kiểu quiz từ overview buổi học — mỗi assignmentId một dòng (ưu tiên buổi đầu gặp).
 */
export function extractQuizCandidatesFromOverview(
  overviewBlocks: OverviewClassSessions[],
): QuizOverviewCandidate[] {
  const seen = new Map<number, QuizOverviewCandidate>();
  for (const block of overviewBlocks) {
    for (const session of block.sessions ?? []) {
      const sessionTitle = session.title ?? null;
      for (const a of session.assignments ?? []) {
        const id = a.assignmentId;
        if (!Number.isFinite(id) || !isQuizExerciseType(a.exerciseType)) continue;
        if (seen.has(id)) continue;
        const title = (a.title ?? '').trim() || 'Bài trắc nghiệm';
        seen.set(id, { assignmentId: id, title, sessionTitle });
      }
    }
  }
  return [...seen.values()];
}

export type AssignmentDetailQuizResolve =
  | { kind: 'linked'; item: QuizAssignmentListItem }
  | { kind: 'missing_link' }
  | null;

export function mapStudentAssignmentDetailToQuizRow(
  detail: StudentAssignmentDetail,
  fallback: QuizOverviewCandidate,
): AssignmentDetailQuizResolve {
  if (!isQuizExerciseType(detail.exerciseType)) return null;
  if (!detail.testQuizFormPublicId?.trim()) return { kind: 'missing_link' };
  const sessionTitle =
    detail.classSessionTitle?.trim() ||
    detail.courseSessionTitle?.trim() ||
    fallback.sessionTitle;
  return {
    kind: 'linked',
    item: {
      assignmentId: detail.assignmentId,
      assignmentTitle:
        detail.title?.trim() || fallback.title || `Bài tập #${detail.assignmentId}`,
      formPublicId: detail.testQuizFormPublicId.trim(),
      scoreDisplay: detail.result.scoreDisplay,
      resultStatus: detail.result.resultStatus,
      deadline: detail.deadline,
      sessionTitle,
      quizMaxAttempts:
        typeof detail.quizMaxAttempts === 'number' ? detail.quizMaxAttempts : null,
    },
  };
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

export function collectFormPublicIdsForProgress(
  publicForms: Array<{ formPublicId: string }>,
  assignmentRows: QuizAssignmentListItem[],
): string[] {
  const ids = new Set<string>();
  for (const row of publicForms) {
    if (row.formPublicId) ids.add(row.formPublicId);
  }
  for (const row of assignmentRows) {
    if (row.formPublicId) ids.add(row.formPublicId);
  }
  return [...ids];
}
