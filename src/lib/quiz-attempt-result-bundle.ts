import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action';
import { loadAssignmentQuizActionStateWithAccess } from '@/lib/quiz-assignment-action';
import type { QuizAttemptResultSnapshot } from '@/features/quiz-test/types/quiz-attempt-result';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import {
  quizRuntimeQueryFromAccess,
  resolveQuizRuntimeAccess,
  type QuizRuntimeAccess,
} from '@/lib/quiz-runtime-access';
import type { QuizEligibilityFromCrm } from '@/features/quiz-test/lib/quiz-result-view-policy';

export type QuizAttemptResultBundle = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  eligibility: QuizEligibilityFromCrm | null;
  assignmentAction: AssignmentQuizActionState | null;
};

async function fetchQuizEligibility(
  formPublicId: string,
  assignmentId: number,
): Promise<QuizEligibilityFromCrm | null> {
  const res = await fetch(
    `/api/assignments/quiz-eligibility/${encodeURIComponent(formPublicId)}?assignmentId=${assignmentId}`,
    {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as QuizEligibilityFromCrm | null;
}

/**
 * Một lần resolve access + song song form / attempt / eligibility / action state.
 */
export async function fetchQuizAttemptResultBundle(
  formPublicId: string,
  attemptPublicId: string,
): Promise<QuizAttemptResultBundle> {
  const access = await resolveQuizRuntimeAccess(formPublicId, {
    attemptPublicId,
    intent: 'access',
  });
  if (!access) {
    throw new Error('Không xác định được quyền xem kết quả (bài tập hoặc ôn luyện).');
  }

  const querySuffix = quizRuntimeQueryFromAccess(access);
  const assignmentId =
    access.mode === 'assignment' && access.assignmentId != null
      ? access.assignmentId
      : null;

  const [formRes, attemptRes, eligibility, assignmentAction] = await Promise.all([
    fetchQuizRuntimeJson<QuizPublishedFormPayload>(
      `${quizRuntimePublicUrl(`forms/${formPublicId}/result-layout`)}${querySuffix}`,
    ),
    fetchQuizRuntimeJson<QuizAttemptResultSnapshot>(
      quizRuntimePublicUrl(`attempts/${attemptPublicId}`),
    ),
    assignmentId != null
      ? fetchQuizEligibility(formPublicId, assignmentId)
      : Promise.resolve(null),
    assignmentId != null
      ? loadAssignmentQuizActionStateWithAccess(formPublicId, assignmentId, access)
      : Promise.resolve(null),
  ]);

  if (!formRes.ok || !attemptRes.ok) {
    const formErr = formRes.data as unknown as { message?: string };
    const attemptErr = attemptRes.data as unknown as { message?: string };
    const msg =
      typeof formErr?.message === 'string'
        ? formErr.message
        : typeof attemptErr?.message === 'string'
          ? attemptErr.message
          : 'Không tải được kết quả bài làm.';
    throw new Error(msg);
  }

  if (!formRes.data || !attemptRes.data) {
    throw new Error('Không có dữ liệu kết quả.');
  }

  return {
    access,
    formPayload: formRes.data,
    attempt: attemptRes.data,
    eligibility,
    assignmentAction,
  };
}
