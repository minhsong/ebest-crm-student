import type { AssignmentQuizActionState } from '@/lib/quiz-assignment-action';
import {
  buildAssignmentResultsHref,
  buildAssignmentQuizActionFromEligibility,
} from '@/lib/quiz-assignment-action';
import type { QuizAttemptResultSnapshot } from '@/features/quiz-test/types/quiz-attempt-result';
import {
  fetchQuizRuntimeJson,
  quizRuntimeErrorMessage,
} from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { resolveAssignmentQuizMaxAttempts } from '@/features/quiz-test/lib/quiz-max-attempts-resolve';
import {
  buildQuizEligibilityFromGatewayStats,
  buildQuizResultViewState,
  logQuizResultDetailGate,
  type AttemptScoreRow,
  type QuizAttemptEligibilityStats,
  type QuizResultViewState,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { mergeAssignmentQuizEligibility } from '@/lib/quiz-assignment-eligibility-merge';
import { fetchCrmAssignmentQuizEligibility } from '@/lib/quiz-crm-assignment-eligibility';
import { resolveQuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import {
  enrichAssignmentRuntimeAccess,
  resolveQuizResultViewState,
} from '@/lib/quiz-runtime-eligibility';

export type QuizAttemptReviewBundleStats = QuizAttemptEligibilityStats;

export type QuizAttemptReviewBundleResponse = {
  access: QuizRuntimeAccess & { effectiveMaxAttempts?: number | null };
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  quizAttemptStats?: QuizAttemptReviewBundleStats | null;
  assignmentStats?: QuizAttemptReviewBundleStats | null;
  practiceStats?: QuizAttemptReviewBundleStats | null;
  resultDetailGate?: { canViewResultDetail?: boolean; reason?: string };
};

export type QuizAttemptResultBundle = {
  access: QuizRuntimeAccess;
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  viewState: QuizResultViewState;
  assignmentAction: AssignmentQuizActionState | null;
};

function pickReviewBundleStats(
  data: QuizAttemptReviewBundleResponse,
): QuizAttemptReviewBundleStats | null {
  const raw =
    data.quizAttemptStats ?? data.assignmentStats ?? data.practiceStats ?? null;
  if (!raw || typeof raw !== 'object') return null;
  const submittedCount = Number(raw.submittedCount);
  if (!Number.isFinite(submittedCount)) return null;
  return {
    submittedCount,
    hasPerfectScore: Boolean(raw.hasPerfectScore),
    maxAttempts:
      raw.maxAttempts === null || raw.maxAttempts === undefined
        ? null
        : Number(raw.maxAttempts),
    attemptsRemaining:
      raw.attemptsRemaining === null || raw.attemptsRemaining === undefined
        ? null
        : Number(raw.attemptsRemaining),
  };
}

function reviewBundleMaxAttemptsQuery(access: QuizRuntimeAccess | null): string {
  if (!access) return '';
  const sp = new URLSearchParams();
  if (access.mode === 'assignment') {
    const max = access.effectiveMaxAttempts;
    if (max === null) sp.set('quizMaxAttempts', 'null');
    else if (max != null && Number.isFinite(max) && max >= 0) {
      sp.set('quizMaxAttempts', String(max));
    }
  } else if (access.practiceMode) {
    const max = access.effectiveMaxAttempts;
    if (max === null) sp.set('practiceMaxAttempts', 'null');
    else if (max != null && Number.isFinite(max) && max >= 0) {
      sp.set('practiceMaxAttempts', String(max));
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

async function buildViewStateFromReviewBundle(
  access: QuizRuntimeAccess,
  formPublicId: string,
  stats: QuizAttemptReviewBundleStats | null,
  attemptRows?: AttemptScoreRow[],
): Promise<QuizResultViewState> {
  if (stats) {
    const channel = access.mode === 'assignment' ? 'assignment' : 'practice';
    let eligibility =
      channel === 'assignment' && access.assignmentId != null
        ? null
        : buildQuizEligibilityFromGatewayStats(stats, {
            channel,
            maxAttemptsHint: resolveAssignmentQuizMaxAttempts({
              crm: access.effectiveMaxAttempts,
              gateway: stats.maxAttempts,
            }),
            attemptRows,
          });

    if (channel === 'assignment' && access.assignmentId != null) {
      const crm = await fetchCrmAssignmentQuizEligibility(
        formPublicId,
        access.assignmentId,
      );
      const gatewayItems =
        attemptRows?.map((row) => ({
          attemptPublicId: '',
          status: 'submitted',
          correctCount: row.correctCount,
          totalQuestions: row.totalQuestions,
          assignmentId: access.assignmentId ?? null,
        })) ?? [];
      eligibility = mergeAssignmentQuizEligibility({
        crm,
        gatewayStats: {
          submittedCount: stats.submittedCount,
          hasPerfectScore: stats.hasPerfectScore,
          maxAttempts: stats.maxAttempts,
          attemptsRemaining: stats.attemptsRemaining,
          items: gatewayItems,
        },
        maxSources: {
          crm: crm?.maxAttempts ?? access.effectiveMaxAttempts,
          gateway: stats.maxAttempts,
        },
      });
    }
    return buildQuizResultViewState(eligibility);
  }
  return buildQuizResultViewState(null);
}

/**
 * Một request Gateway (layout + attempt + stats) — eligibility từ `quizAttemptStats` embed.
 */
export async function fetchQuizAttemptResultBundle(
  formPublicId: string,
  attemptPublicId: string,
): Promise<QuizAttemptResultBundle> {
  const aid = attemptPublicId.trim();

  let preAccess = await resolveQuizRuntimeAccess(formPublicId, {
    attemptPublicId: aid,
    intent: 'access',
  });
  if (
    preAccess?.mode === 'assignment' &&
    preAccess.assignmentId != null &&
    preAccess.assignmentId >= 1
  ) {
    preAccess = enrichAssignmentRuntimeAccess(
      formPublicId,
      preAccess,
      preAccess.assignmentId,
    );
  }

  const res = await fetchQuizRuntimeJson<QuizAttemptReviewBundleResponse>(
    `${quizRuntimePublicUrl(`attempts/${aid}/review-bundle`)}${reviewBundleMaxAttemptsQuery(preAccess)}`,
  );

  if (!res.ok || !res.data) {
    throw new Error(
      quizRuntimeErrorMessage(res.status, res.data, 'load'),
    );
  }

  const data = res.data;
  const stats = pickReviewBundleStats(data);
  const attemptRows = (data.quizAttemptStats as { items?: AttemptScoreRow[] } | null)?.items;

  const runtimeAccess = await resolveQuizRuntimeAccess(formPublicId, {
    attemptPublicId: aid,
    assignmentIdHint:
      data.access.mode === 'assignment' && data.access.assignmentId != null
        ? data.access.assignmentId
        : undefined,
    preferPractice: data.access.practiceMode,
    intent: 'access',
  });

  let access: QuizRuntimeAccess = {
    ...data.access,
    effectiveMaxAttempts:
      runtimeAccess?.effectiveMaxAttempts ??
      preAccess?.effectiveMaxAttempts ??
      data.access.effectiveMaxAttempts ??
      stats?.maxAttempts,
  };
  if (access.mode === 'assignment' && access.assignmentId != null) {
    access = enrichAssignmentRuntimeAccess(
      formPublicId,
      access,
      access.assignmentId,
    );
  }

  const serverGate = data.resultDetailGate?.canViewResultDetail;
  let viewState = await buildViewStateFromReviewBundle(
    access,
    formPublicId,
    stats,
    attemptRows,
  );

  logQuizResultDetailGate('review-bundle', viewState.eligibility, {
    serverGate,
    portalCanView: viewState.canViewResultDetail,
    attemptPublicId: aid,
    maxHint: access.effectiveMaxAttempts,
  });

  if (!stats) {
    const assignmentIdHint =
      access.mode === 'assignment' && access.assignmentId != null
        ? access.assignmentId
        : undefined;
    const resolved = await resolveQuizResultViewState(formPublicId, {
      attemptPublicId,
      assignmentIdHint,
      preferPractice: access.practiceMode,
      access,
    });
    access = resolved.access ?? access;
    viewState = {
      eligibility: resolved.eligibility,
      canViewData: resolved.canViewData,
      canViewResultDetail: resolved.canViewResultDetail,
    };
  }

  const assignmentAction =
    access.mode === 'assignment' && access.assignmentId != null
      ? buildAssignmentQuizActionFromEligibility(
          formPublicId,
          viewState.eligibility,
        )
      : null;

  return {
    access,
    formPayload: data.formPayload,
    attempt: data.attempt as QuizAttemptResultSnapshot,
    viewState,
    assignmentAction,
  };
}
