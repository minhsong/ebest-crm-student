'use client';

import { fetchQuizAttemptResultBundle } from '@/lib/quiz-attempt-result-bundle';
import { useEffect, useState } from 'react';

export type { QuizAttemptResultSnapshot } from '@/features/quiz-test/types/quiz-attempt-result';

/**
 * @deprecated Trang kết quả nên dùng `useQuizAttemptResultPage` (một bundle, ít request hơn).
 */
export function useQuizAttemptResultData(
  formPublicId: string,
  attemptPublicId: string,
) {
  const [formPayload, setFormPayload] = useState(
    null as import('@/features/quiz-test/types').QuizPublishedFormPayload | null,
  );
  const [attempt, setAttempt] = useState(
    null as import('@/features/quiz-test/types/quiz-attempt-result').QuizAttemptResultSnapshot | null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const bundle = await fetchQuizAttemptResultBundle(formPublicId, attemptPublicId);
        if (cancelled) return;
        setFormPayload(bundle.formPayload);
        setAttempt(bundle.attempt);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được kết quả bài làm.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formPublicId, attemptPublicId]);

  return { formPayload, attempt, error, loading };
}
