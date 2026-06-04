import {
  buildQuizResultEligibility,
  computeAttemptsRemaining,
  deriveHasPerfectScoreFromRows,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { resolveAssignmentQuizMaxAttempts } from '@/features/quiz-test/lib/quiz-max-attempts-resolve';
import type { GatewayQuizAttemptStats } from '@/lib/quiz-gateway-stats';

export type MergeAssignmentEligibilityInput = {
  crm: QuizResultEligibility | null;
  gatewayStats: GatewayQuizAttemptStats | null;
  maxSources: {
    crm?: number | null;
    session?: number | null;
    gateway?: number | null;
  };
};

/** Gộp: max từ CRM/session; submitted + perfect từ Gateway (Mongo SSOT). */
export function mergeAssignmentQuizEligibility(
  input: MergeAssignmentEligibilityInput,
): QuizResultEligibility | null {
  const { crm, gatewayStats, maxSources } = input;
  if (!crm && !gatewayStats) return null;

  const maxAttempts = resolveAssignmentQuizMaxAttempts(maxSources);
  const submittedCount = Number.isFinite(Number(gatewayStats?.submittedCount))
    ? Number(gatewayStats!.submittedCount)
    : Number(crm?.submittedCount ?? 0);

  const hasPerfectScore = deriveHasPerfectScoreFromRows(
    gatewayStats?.items,
    crm?.hasPerfectScore ?? false,
  );

  return buildQuizResultEligibility({
    submittedCount,
    hasPerfectScore,
    maxAttempts,
    attemptsRemaining: computeAttemptsRemaining(maxAttempts, submittedCount),
  });
}
