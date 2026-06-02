'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchQuizAttemptResultBundle } from '@/lib/quiz-attempt-result-bundle';
import type { QuizAttemptResultBundle } from '@/lib/quiz-attempt-result-bundle';
import { useQuizReviewViewModel } from '@/features/quiz-test/hooks/useQuizReviewViewModel';
import { getCannotViewResultMessage } from '@/features/quiz-test/lib/quiz-result-view-policy';

export function useQuizAttemptResultPage(
  formPublicId: string,
  attemptPublicId: string,
) {
  const [bundle, setBundle] = useState<QuizAttemptResultBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const fid = formPublicId.trim();
    const aid = attemptPublicId.trim();
    if (!fid || !aid) {
      setBundle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await fetchQuizAttemptResultBundle(fid, aid);
      setBundle(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được kết quả.');
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [attemptPublicId, formPublicId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reviewViewModel = useQuizReviewViewModel(
    bundle?.formPayload && bundle?.attempt
      ? { formPayload: bundle.formPayload, attempt: bundle.attempt }
      : null,
  );

  const canViewData = bundle?.viewState.canViewData ?? null;

  return {
    loading,
    error,
    reload,
    bundle,
    reviewViewModel,
    formPayload: bundle?.formPayload ?? null,
    attempt: bundle?.attempt ?? null,
    access: bundle?.access ?? null,
    assignmentId:
      bundle?.access.mode === 'assignment' ? bundle.access.assignmentId : undefined,
    practiceMode: bundle?.access.practiceMode ?? false,
    assignmentAction: bundle?.assignmentAction ?? null,
    canViewData,
    getCannotViewResultMessage,
  };
}
