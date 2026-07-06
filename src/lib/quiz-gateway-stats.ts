import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import {
  quizRuntimePublicUrl,
  isMockTestOnlineQuizRuntimeActive,
} from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import { normalizeQuizAttemptHistoryItem } from '@/features/quiz-test/lib/quiz-attempt-history';
import type { QuizAttemptEligibilityStats } from '@/features/quiz-test/lib/quiz-result-view-policy';

export type GatewayQuizAttemptStats = QuizAttemptEligibilityStats & {
  items: Array<{
    attemptPublicId: string;
    status: string;
    startedAt?: string;
    submittedAt?: string | null;
    score?: number | null;
    scoreDisplay?: string | null;
    correctCount?: number | null;
    totalQuestions?: number | null;
    assignmentId: number | null;
  }>;
};

function appendMaxAttemptsQuery(
  sp: URLSearchParams,
  paramName: 'quizMaxAttempts' | 'practiceMaxAttempts',
  value?: number | null,
): void {
  if (value === null) {
    sp.set(paramName, 'null');
  } else if (value != null && value >= 0) {
    sp.set(paramName, String(value));
  }
}

export type FetchGatewayQuizStatsParams =
  | {
      channel: 'assignment';
      assignmentId: number;
      maxAttemptsHint?: number | null;
    }
  | {
      channel: 'practice';
      maxAttemptsHint?: number | null;
    };

export async function fetchGatewayQuizStats(
  formPublicId: string,
  params: FetchGatewayQuizStatsParams,
): Promise<GatewayQuizAttemptStats | null> {
  if (isMockTestOnlineQuizRuntimeActive()) {
    const maxAttempts =
      params.maxAttemptsHint != null && params.maxAttemptsHint >= 0
        ? params.maxAttemptsHint
        : 1;
    return {
      submittedCount: 0,
      hasPerfectScore: false,
      maxAttempts,
      attemptsRemaining: maxAttempts,
      items: [],
    };
  }

  const sp = new URLSearchParams();

  if (params.channel === 'assignment') {
    sp.set('assignmentId', String(params.assignmentId));
    appendMaxAttemptsQuery(sp, 'quizMaxAttempts', params.maxAttemptsHint);
    const path = `forms/${formPublicId}/assignment-quiz-stats`;
    const res = await fetchQuizRuntimeJson<GatewayQuizAttemptStats>(
      `${quizRuntimePublicUrl(path)}?${sp.toString()}`,
    );
    return res.ok && res.data ? res.data : null;
  }

  appendMaxAttemptsQuery(sp, 'practiceMaxAttempts', params.maxAttemptsHint);
  const path = `forms/${formPublicId}/practice-quiz-stats`;
  const res = await fetchQuizRuntimeJson<GatewayQuizAttemptStats>(
    `${quizRuntimePublicUrl(path)}?${sp.toString()}`,
  );
  return res.ok && res.data ? res.data : null;
}

export function historyItemsFromGatewayStats(
  formPublicId: string,
  stats: GatewayQuizAttemptStats,
): QuizAttemptHistoryItem[] {
  return stats.items
    .map((row) =>
      normalizeQuizAttemptHistoryItem({
        attemptPublicId: row.attemptPublicId,
        formPublicId,
        status: row.status,
        startedAt: row.startedAt ?? '',
        submittedAt: row.submittedAt,
        assignmentId: row.assignmentId,
        score: row.score,
        scoreDisplay: row.scoreDisplay,
        correctCount: row.correctCount,
        totalQuestions: row.totalQuestions,
      }),
    )
    .filter(Boolean) as QuizAttemptHistoryItem[];
}
