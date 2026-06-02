import { getQuizFormContext } from '@/lib/quiz-form-context';
import {
  assignmentActionStateFromSnapshot,
} from '@/lib/quiz-assignment-action.builders';
import { fetchAssignmentQuizSnapshot, fetchPracticeQuizSnapshot } from '@/lib/quiz-assignment-action.loader';
import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action.types';
import { pinAssignmentQuizRuntimeAccess, type QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { buildAssignmentResultsHref } from '@/lib/quiz-assignment-action.builders';

export type {
  AssignmentQuizEligibility,
  AssignmentQuizActionState,
  AssignmentQuizSnapshot,
} from '@/lib/quiz-assignment-action.types';

export {
  buildAssignmentResultsHref,
  buildAssignmentQuizActionFromEligibility,
} from '@/lib/quiz-assignment-action.builders';

export {
  fetchAssignmentQuizSnapshot,
  fetchPracticeQuizSnapshot,
} from '@/lib/quiz-assignment-action.loader';

/**
 * Trạng thái nút Làm bài / Xem kết quả cho bài tập QUIZ.
 */
export async function loadAssignmentQuizActionState(
  formPublicId: string,
  assignmentId: number,
  maxAttemptsHint?: number | null,
): Promise<AssignmentQuizActionState> {
  if (maxAttemptsHint !== undefined) {
    pinAssignmentQuizRuntimeAccess(formPublicId, assignmentId, {
      quizMaxAttempts: maxAttemptsHint,
    });
  } else {
    pinAssignmentQuizRuntimeAccess(formPublicId, assignmentId);
  }

  const stored = getQuizFormContext(formPublicId);
  const hint =
    maxAttemptsHint !== undefined
      ? maxAttemptsHint
      : stored?.mode === 'assignment' && stored.assignmentId === assignmentId
        ? stored.quizMaxAttempts
        : undefined;

  return loadAssignmentQuizActionStateWithAccess(
    formPublicId,
    assignmentId,
    null,
    hint,
  );
}

export async function loadAssignmentQuizActionStateWithAccess(
  formPublicId: string,
  assignmentId: number,
  _access: QuizRuntimeAccess | null,
  quizMaxAttemptsHint?: number | null,
): Promise<AssignmentQuizActionState> {
  try {
    const snapshot = await fetchAssignmentQuizSnapshot({
      formPublicId,
      assignmentId,
      maxAttemptsHint: quizMaxAttemptsHint,
    });
    return assignmentActionStateFromSnapshot(formPublicId, snapshot);
  } catch (e) {
    return assignmentActionStateFromSnapshot(
      formPublicId,
      {
        canStart: false,
        startBlockReason: null,
        eligibility: null,
        submittedAttempts: [],
        canViewResultDetail: false,
        canViewResults: false,
      },
      {
        loading: false,
        error: e instanceof Error ? e.message : 'Không tải được trạng thái bài làm.',
      },
    );
  }
}

/** Ôn luyện — cùng quy tắc xem chi tiết với bài tập. */
export async function loadPracticeQuizActionState(
  formPublicId: string,
  practiceMaxAttemptsHint?: number | null,
): Promise<
  Pick<
    AssignmentQuizActionState,
    'eligibility' | 'submittedAttempts' | 'canViewResultDetail' | 'canViewResults' | 'resultsPageHref'
  >
> {
  const resultsPageHref = buildAssignmentResultsHref(formPublicId);

  try {
    const snapshot = await fetchPracticeQuizSnapshot(
      formPublicId,
      practiceMaxAttemptsHint,
    );
    return { ...snapshot, resultsPageHref };
  } catch {
    return {
      eligibility: null,
      submittedAttempts: [],
      canViewResultDetail: false,
      canViewResults: false,
      resultsPageHref,
    };
  }
}
