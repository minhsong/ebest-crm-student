import {
  buildQuizEligibilityFromGatewayStats,
  isQuizResultDetailEligible,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { fetchGatewayQuizStats } from '@/lib/quiz-gateway-stats';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';

async function fetchCrmAssignmentEligibilityFallback(
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
  return (await res.json()) as QuizResultEligibility;
}

/**
 * Tải eligibility từ Gateway (Mongo SSOT), fallback CRM chỉ cho assignment.
 */
export async function fetchQuizEligibilityForAccess(
  formPublicId: string,
  access: QuizRuntimeAccess,
): Promise<QuizResultEligibility | null> {
  if (access.mode === 'assignment' && access.assignmentId != null) {
    const stats = await fetchGatewayQuizStats(formPublicId, {
      channel: 'assignment',
      assignmentId: access.assignmentId,
      maxAttemptsHint: access.effectiveMaxAttempts,
    });
    const fromGateway = buildQuizEligibilityFromGatewayStats(stats, {
      channel: 'assignment',
      maxAttemptsHint: access.effectiveMaxAttempts,
    });
    if (fromGateway) return fromGateway;
    return fetchCrmAssignmentEligibilityFallback(formPublicId, access.assignmentId);
  }

  if (access.mode === 'practice') {
    const stats = await fetchGatewayQuizStats(formPublicId, {
      channel: 'practice',
      maxAttemptsHint: access.effectiveMaxAttempts,
    });
    return buildQuizEligibilityFromGatewayStats(stats, {
      channel: 'practice',
      maxAttemptsHint: access.effectiveMaxAttempts,
    });
  }

  return null;
}

export function canViewQuizResultDetail(
  eligibility: QuizResultEligibility | null,
): boolean {
  return isQuizResultDetailEligible(eligibility);
}
