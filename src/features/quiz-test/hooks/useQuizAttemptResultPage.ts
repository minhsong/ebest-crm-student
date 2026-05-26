'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuizAttemptResultBundle } from '@/lib/quiz-attempt-result-bundle';
import type { QuizAttemptResultBundle } from '@/lib/quiz-attempt-result-bundle';
import {
  buildCorrectByFormItemId,
  buildGradingPerItem,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import {
  computeCanViewResultDetails,
  type CanViewResultData,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
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

  const correctByFormItemId = useMemo(
    () => buildCorrectByFormItemId(bundle?.attempt.grading?.items),
    [bundle?.attempt.grading?.items],
  );

  const gradingPerItem = useMemo(
    () => buildGradingPerItem(bundle?.attempt.grading?.items),
    [bundle?.attempt.grading?.items],
  );

  const canViewData: CanViewResultData | null = useMemo(() => {
    if (!bundle) return null;
    return computeCanViewResultDetails({
      eligibility: bundle.eligibility,
    });
  }, [bundle]);

  return {
    loading,
    error,
    reload,
    bundle,
    formPayload: bundle?.formPayload ?? null,
    attempt: bundle?.attempt ?? null,
    access: bundle?.access ?? null,
    assignmentId:
      bundle?.access.mode === 'assignment' ? bundle.access.assignmentId : undefined,
    practiceMode: bundle?.access.practiceMode ?? false,
    assignmentAction: bundle?.assignmentAction ?? null,
    correctByFormItemId,
    gradingPerItem,
    canViewData,
    getCannotViewResultMessage,
  };
}
