import { unwrapCrmPayload } from '@/lib/crm-payload';
import type { QuizResultEligibility } from '@/features/quiz-test/lib/quiz-result-view-policy';

/** GET CRM quiz-eligibility — maxAttempts SSOT từ assignment.quizMaxAttempts. */
export async function fetchCrmAssignmentQuizEligibility(
  formPublicId: string,
  assignmentId: number,
): Promise<QuizResultEligibility | null> {
  const res = await fetch(
    `/api/assignments/quiz-eligibility/${encodeURIComponent(formPublicId)}?assignmentId=${assignmentId}`,
    {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  if (!res.ok) return null;
  const raw = await res.json().catch(() => null);
  const inner = unwrapCrmPayload<QuizResultEligibility | null>(raw);
  if (!inner || typeof inner !== 'object') return null;
  const submittedCount = Number(
    (inner as QuizResultEligibility).submittedCount,
  );
  if (!Number.isFinite(submittedCount)) return null;
  return inner as QuizResultEligibility;
}
