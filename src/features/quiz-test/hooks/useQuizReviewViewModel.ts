'use client';

import { useMemo } from 'react';
import {
  buildQuizReviewViewModel,
  type QuizReviewBundlePayload,
  type QuizReviewViewModel,
  type QuizReviewViewModelOptions,
} from '@/features/quiz-test/lib/quiz-review-view-model';

export function useQuizReviewViewModel(
  bundle: QuizReviewBundlePayload,
  options?: QuizReviewViewModelOptions,
): QuizReviewViewModel;
export function useQuizReviewViewModel(
  bundle: QuizReviewBundlePayload | null | undefined,
  options?: QuizReviewViewModelOptions,
): QuizReviewViewModel | null;
export function useQuizReviewViewModel(
  bundle: QuizReviewBundlePayload | null | undefined,
  options?: QuizReviewViewModelOptions,
) {
  return useMemo(() => {
    if (!bundle) return null;
    return buildQuizReviewViewModel(bundle, options);
  }, [bundle, options?.showExplanation]);
}
