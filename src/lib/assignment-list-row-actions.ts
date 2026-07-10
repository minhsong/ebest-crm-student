import type { AssignmentOverviewRow } from '@/lib/assignments-overview-grouping';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import { isQuizExerciseType } from '@/features/quiz-test/lib/quiz-assignment-overview';
import { buildGameReadyHrefForAssignment } from '@/features/learning/games/session/game-assignment-route.utils';

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
    }
  | {
      kind: 'vocabulary_drill_start';
      assignmentId: number;
      classId: number;
    };

export function deriveAssignmentListRowAction(
  row: AssignmentOverviewRow,
  options?: { canInteract?: boolean },
): AssignmentListRowAction {
  if (options?.canInteract === false) {
    return { kind: 'detail' };
  }

  if (isVocabularyDrillAssignment(row)) {
    return {
      kind: 'vocabulary_drill_start',
      assignmentId: row.assignmentId,
      classId: row.classId,
    };
  }

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

export function buildVocabularyDrillStartHref(
  classId: number,
  assignmentId: number,
  promptType?: string | null,
): string {
  return buildGameReadyHrefForAssignment(classId, assignmentId, promptType);
}

export function isVocabularyDrillAssignment(row: {
  exerciseType: string | null;
}): boolean {
  return row.exerciseType === 'vocabulary_drill';
}
