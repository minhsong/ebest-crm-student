import {
  buildQuizEligibilityFromGatewayStats,
  buildQuizResultViewState,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { fetchQuizStartEligibility } from '@/lib/quiz-assignment-crm';
import type { AssignmentQuizSnapshot } from '@/lib/quiz-assignment-action.types';
import {
  assignmentSnapshotFromEligibility,
} from '@/lib/quiz-assignment-action.builders';
import { mergeAssignmentQuizEligibility } from '@/lib/quiz-assignment-eligibility-merge';
import { fetchCrmAssignmentQuizEligibility } from '@/lib/quiz-crm-assignment-eligibility';
import {
  fetchGatewayQuizStats,
  historyItemsFromGatewayStats,
} from '@/lib/quiz-gateway-stats';

export type FetchAssignmentQuizSnapshotParams = {
  formPublicId: string;
  assignmentId: number;
  maxAttemptsHint?: number | null;
};

/** SSOT: Gateway stats + CRM start gate → snapshot assignment quiz. */
export async function fetchAssignmentQuizSnapshot(
  params: FetchAssignmentQuizSnapshotParams,
): Promise<AssignmentQuizSnapshot> {
  const { formPublicId, assignmentId, maxAttemptsHint } = params;

  const [startGate, stats, crmEligibility] = await Promise.all([
    fetchQuizStartEligibility(assignmentId),
    fetchGatewayQuizStats(formPublicId, {
      channel: 'assignment',
      assignmentId,
      maxAttemptsHint,
    }),
    fetchCrmAssignmentQuizEligibility(formPublicId, assignmentId),
  ]);

  const submittedAttempts = stats
    ? historyItemsFromGatewayStats(formPublicId, stats)
    : [];

  const eligibility = mergeAssignmentQuizEligibility({
    crm: crmEligibility,
    gatewayStats: stats,
    maxSources: {
      crm: crmEligibility?.maxAttempts ?? maxAttemptsHint,
      gateway: stats?.maxAttempts,
    },
  });

  return assignmentSnapshotFromEligibility(eligibility, {
    canStart: startGate.allowed === true,
    startBlockReason: startGate.allowed ? null : startGate.reason,
    submittedAttempts,
  });
}

export async function fetchPracticeQuizSnapshot(
  formPublicId: string,
  practiceMaxAttemptsHint?: number | null,
): Promise<
  Pick<
    AssignmentQuizSnapshot,
    'eligibility' | 'submittedAttempts' | 'canViewResultDetail' | 'canViewResults'
  >
> {
  const stats = await fetchGatewayQuizStats(formPublicId, {
    channel: 'practice',
    maxAttemptsHint: practiceMaxAttemptsHint,
  });
  const eligibility = buildQuizEligibilityFromGatewayStats(stats, {
    channel: 'practice',
    maxAttemptsHint: practiceMaxAttemptsHint,
    attemptRows: stats?.items,
  });
  const view = buildQuizResultViewState(eligibility);
  const submittedAttempts = stats
    ? historyItemsFromGatewayStats(formPublicId, stats)
    : [];

  return {
    eligibility,
    submittedAttempts,
    canViewResultDetail: view.canViewResultDetail,
    canViewResults: view.canViewResultDetail,
  };
}
