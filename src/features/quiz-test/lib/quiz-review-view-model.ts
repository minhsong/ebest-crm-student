import type { QuizAttemptResultSnapshot } from '@/features/quiz-test/types/quiz-attempt-result';
import type {
  QuizFormSectionPayload,
  QuizPublishedFormPayload,
} from '@/features/quiz-test/types';
import {
  collectFormTagKeysFromItems,
  formatQuizDurationSummary,
} from '@/features/quiz-test/lib/quiz-form-meta';
import {
  buildQuizRenderableBlocks,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import {
  buildBlockStartIndexes,
  buildCorrectByFormItemId,
  buildGradingPerItem,
  type QuizGradingPerItem,
} from '@/features/quiz-test/lib/quiz-runtime-view';

export type QuizReviewBundlePayload = {
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
};

export type QuizReviewViewModelOptions = {
  showExplanation?: boolean;
};

export type QuizReviewViewModel = {
  formPayload: QuizPublishedFormPayload;
  attempt: QuizAttemptResultSnapshot;
  formDisplayName: string;
  formTagKeys: string[];
  durationSummary: string;
  showExplanationOnReview: boolean;
  renderBlocks: QuizRenderableBlock[];
  blockStartIndexes: number[];
  sectionsOrdered: QuizFormSectionPayload[];
  allSectionKeys: string[];
  answers: Record<string, unknown>;
  correctByFormItemId: Record<string, boolean>;
  gradingPerItem: Record<string, QuizGradingPerItem | undefined>;
};

function resolveShowExplanationOnReview(
  formPayload: QuizPublishedFormPayload,
  showExplanation?: boolean,
): boolean {
  if (showExplanation !== undefined) return showExplanation;
  const blueprint = formPayload?.blueprint as Record<string, unknown> | null | undefined;
  if (!blueprint || typeof blueprint !== 'object') return false;
  const review = blueprint?.review as Record<string, unknown> | null | undefined;
  if (!review || typeof review !== 'object') return false;
  return Boolean(review?.showExplanationOnReview);
}

export function buildQuizReviewViewModel(
  bundle: QuizReviewBundlePayload,
  options?: QuizReviewViewModelOptions,
): QuizReviewViewModel {
  const { formPayload, attempt } = bundle;
  const renderBlocks = buildQuizRenderableBlocks(formPayload);
  const blockStartIndexes = buildBlockStartIndexes(renderBlocks);

  const sectionsOrdered = Array.isArray(formPayload?.sections)
    ? [...(formPayload.sections as QuizFormSectionPayload[])].sort(
        (a, b) => a.order - b.order,
      )
    : [];

  const items = renderBlocks.flatMap((b) =>
    b.kind === 'single' ? [b.item] : b.items,
  );

  const formDisplayName =
    typeof formPayload.name === 'string' && formPayload.name.trim()
      ? formPayload.name.trim()
      : `Đề #${formPayload.crmFormId}`;

  return {
    formPayload,
    attempt,
    formDisplayName,
    formTagKeys: collectFormTagKeysFromItems(items),
    durationSummary: formatQuizDurationSummary(
      Number(formPayload?.durationSeconds ?? 0),
    ),
    showExplanationOnReview: resolveShowExplanationOnReview(
      formPayload,
      options?.showExplanation,
    ),
    renderBlocks,
    blockStartIndexes,
    sectionsOrdered,
    allSectionKeys: sectionsOrdered.map((s) => String(s.sectionId)),
    answers: attempt.answersByFormItemId ?? {},
    correctByFormItemId: buildCorrectByFormItemId(attempt.grading?.items),
    gradingPerItem: buildGradingPerItem(attempt.grading?.items),
  };
}
