import {
  buildQuizEligibilityFromGatewayStats,
  buildQuizResultViewState,
  type QuizResultEligibility,
  type QuizResultViewState,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { resolveAssignmentQuizMaxAttempts } from '@/features/quiz-test/lib/quiz-max-attempts-resolve';
import { mergeAssignmentQuizEligibility } from '@/lib/quiz-assignment-eligibility-merge';
import { fetchCrmAssignmentQuizEligibility } from '@/lib/quiz-crm-assignment-eligibility';
import { fetchGatewayQuizStats } from '@/lib/quiz-gateway-stats';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { resolveQuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { getQuizFormContext } from '@/lib/quiz-form-context';

/**
 * Tải eligibility: assignment = CRM max + Gateway counts; practice = Gateway + hint.
 */
export async function fetchQuizEligibilityForAccess(
  formPublicId: string,
  access: QuizRuntimeAccess,
): Promise<QuizResultEligibility | null> {
  if (access.mode === 'assignment' && access.assignmentId != null) {
    const assignmentId = access.assignmentId;
    const stored = getQuizFormContext(formPublicId);
    const sessionMax =
      stored?.mode === 'assignment' && stored.assignmentId === assignmentId
        ? stored.quizMaxAttempts
        : undefined;

    const [stats, crmEligibility] = await Promise.all([
      fetchGatewayQuizStats(formPublicId, {
        channel: 'assignment',
        assignmentId,
        maxAttemptsHint: access.effectiveMaxAttempts,
      }),
      fetchCrmAssignmentQuizEligibility(formPublicId, assignmentId),
    ]);

    return mergeAssignmentQuizEligibility({
      crm: crmEligibility,
      gatewayStats: stats,
      maxSources: {
        crm: crmEligibility?.maxAttempts ?? access.effectiveMaxAttempts,
        session: sessionMax,
        gateway: stats?.maxAttempts,
      },
    });
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
  return buildQuizResultViewState(eligibility).canViewResultDetail;
}

/**
 * SSOT: resolve access (CRM authorize) + eligibility (Gateway stats + max hint) → view state.
 */
export async function resolveQuizResultViewState(
  formPublicId: string,
  options?: {
    access?: QuizRuntimeAccess | null;
    attemptPublicId?: string;
    assignmentIdHint?: number;
    preferPractice?: boolean;
  },
): Promise<QuizResultViewState & { access: QuizRuntimeAccess | null }> {
  const access =
    options?.access ??
    (await resolveQuizRuntimeAccess(formPublicId, {
      attemptPublicId: options?.attemptPublicId,
      assignmentIdHint: options?.assignmentIdHint,
      preferPractice: options?.preferPractice,
      intent: 'access',
    }));

  if (!access) {
    const empty = buildQuizResultViewState(null);
    return { ...empty, access: null };
  }

  const eligibility = await fetchQuizEligibilityForAccess(formPublicId, access);
  const view = buildQuizResultViewState(eligibility);
  return { ...view, access };
}

/** Gắn effectiveMaxAttempts từ CRM/session trước khi gọi stats Gateway. */
export function enrichAssignmentRuntimeAccess(
  formPublicId: string,
  access: QuizRuntimeAccess,
  assignmentId: number,
): QuizRuntimeAccess {
  if (access.mode !== 'assignment') return access;
  const stored = getQuizFormContext(formPublicId);
  const sessionMax =
    stored?.mode === 'assignment' && stored.assignmentId === assignmentId
      ? stored.quizMaxAttempts
      : undefined;
  const effectiveMaxAttempts = resolveAssignmentQuizMaxAttempts({
    crm: access.effectiveMaxAttempts,
    session: sessionMax,
  });
  if (effectiveMaxAttempts === access.effectiveMaxAttempts) return access;
  return { ...access, effectiveMaxAttempts };
}
