import type { AssignmentOverviewRow } from '@/lib/assignments-overview-grouping';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import { isQuizExerciseType } from '@/features/quiz-test/lib/quiz-assignment-overview';

/** Đã có tóm tắt điểm trên CRM (sau sync quiz hoặc chấm tay). */
export function assignmentHasGradedSummary(row: {
  resultStatus: number | null;
  scoreDisplay: string | null;
}): boolean {
  if (row.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return true;
  return Boolean(row.scoreDisplay?.trim());
}

export function isQuizAssignmentWithLinkedForm(row: {
  exerciseType: string | null;
  testQuizFormPublicId: string | null;
}): boolean {
  return (
    isQuizExerciseType(row.exerciseType) &&
    Boolean(row.testQuizFormPublicId?.trim())
  );
}

export type AssignmentListRowAction =
  | { kind: 'detail' }
  | {
      kind: 'quiz_start';
      formPublicId: string;
      assignmentId: number;
      quizMaxAttempts: number | null;
    };

/**
 * Nút danh sách /assignments — chỉ dùng field từ GET overview/sessions (không gọi Gateway/CRM thêm).
 * - QUIZ + còn được làm thêm (chưa chấm, hoặc quizMaxAttempts null/>1) → Làm bài.
 * - Còn lại → Chi tiết (modal).
 */
export function deriveAssignmentListRowAction(
  row: AssignmentOverviewRow,
): AssignmentListRowAction {
  const formPublicId = row.testQuizFormPublicId?.trim();
  if (formPublicId && isQuizAssignmentWithLinkedForm(row)) {
    const max = row.quizMaxAttempts;
    const mayRetryAfterGrade = max == null || max > 1;
    if (!assignmentHasGradedSummary(row) || mayRetryAfterGrade) {
      return {
        kind: 'quiz_start',
        formPublicId,
        assignmentId: row.assignmentId,
        quizMaxAttempts: row.quizMaxAttempts,
      };
    }
  }
  return { kind: 'detail' };
}

export function buildQuizStartHref(
  formPublicId: string,
  assignmentId: number,
): string {
  const sp = new URLSearchParams();
  sp.set('assignmentId', String(assignmentId));
  return `/quiz-test/${encodeURIComponent(formPublicId)}?${sp.toString()}`;
}
