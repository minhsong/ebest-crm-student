'use client';

import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import { useEffect, useState } from 'react';

export type QuizAttemptResultSnapshot = {
  attemptPublicId: string;
  formPublicId: string;
  status: string;
  answersByFormItemId?: Record<string, unknown>;
  startedAt?: string;
  submittedAt?: string | null;
  expiresAt?: string;
  grading?: {
    summary?: {
      totalQuestions?: number;
      correctCount?: number;
    };
    items?: Array<{
      formItemId?: string | number;
      isCorrect?: boolean;
    }>;
  } | null;
};

export function useQuizAttemptResultData(
  formPublicId: string,
  attemptPublicId: string,
) {
  const [formPayload, setFormPayload] = useState<QuizPublishedFormPayload | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptResultSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [formRes, attemptRes] = await Promise.all([
          fetchQuizRuntimeJson<QuizPublishedFormPayload>(
            quizRuntimePublicUrl(`forms/${formPublicId}`),
          ),
          fetchQuizRuntimeJson<QuizAttemptResultSnapshot>(
            quizRuntimePublicUrl(`attempts/${attemptPublicId}`),
          ),
        ]);
        if (!formRes.ok || !attemptRes.ok) {
          throw new Error('Không tải được kết quả bài làm.');
        }
        if (cancelled) return;
        setFormPayload(formRes.data);
        setAttempt(attemptRes.data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Không tải được kết quả.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptPublicId, formPublicId]);

  return { formPayload, attempt, error, loading };
}
