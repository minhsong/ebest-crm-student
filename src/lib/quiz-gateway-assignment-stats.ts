import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizAttemptHistoryItem } from '@/features/quiz-test/types';
import { normalizeQuizAttemptHistoryItem } from '@/features/quiz-test/lib/quiz-attempt-history';

export type GatewayAssignmentQuizStats = {
  submittedCount: number;
  hasPerfectScore: boolean;
  maxAttempts: number | null;
  attemptsRemaining: number | null;
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

export async function fetchGatewayAssignmentQuizStats(
  formPublicId: string,
  assignmentId: number,
  quizMaxAttempts?: number | null,
): Promise<GatewayAssignmentQuizStats | null> {
  const sp = new URLSearchParams();
  sp.set('assignmentId', String(assignmentId));
  if (quizMaxAttempts === null) {
    sp.set('quizMaxAttempts', 'null');
  } else if (quizMaxAttempts != null && quizMaxAttempts >= 0) {
    sp.set('quizMaxAttempts', String(quizMaxAttempts));
  }

  const res = await fetchQuizRuntimeJson<GatewayAssignmentQuizStats>(
    `${quizRuntimePublicUrl(`forms/${formPublicId}/assignment-quiz-stats`)}?${sp.toString()}`,
  );
  if (!res.ok || !res.data) return null;
  return res.data;
}

export function historyItemsFromGatewayStats(
  formPublicId: string,
  stats: GatewayAssignmentQuizStats,
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
