import type { QuizPublishedFormPayload, StartAttemptResponse } from '@/features/quiz-test/types';

/**
 * API resume đôi khi không có `durationSeconds` trên snapshot attempt — lấy từ form đã publish (đồng bộ với gateway).
 */
export function mergeAttemptWithFormPublishedDuration(
  attempt: StartAttemptResponse,
  form: QuizPublishedFormPayload | null | undefined,
): StartAttemptResponse {
  let ds = Number(attempt.durationSeconds ?? 0);
  if (Number.isFinite(ds) && ds > 0) return attempt;
  const fromForm = Math.max(0, Math.floor(Number(form?.durationSeconds ?? 0)));
  if (fromForm > 0) {
    return { ...attempt, durationSeconds: fromForm };
  }
  return attempt;
}
