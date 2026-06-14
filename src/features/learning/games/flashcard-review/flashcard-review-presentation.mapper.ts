export type FlashcardReviewSessionConfigLike = {
  gameFamily: 'flashcard_review';
  modeId: 'session_review';
  presentation: {
    coreLayoutProfileId: string;
    detailWidgetId: string;
    resultProfileId: string;
  };
};

export type FlashcardReviewPresentationProfile = {
  coreLayoutProfileId: string;
  detailWidgetId: string;
  resultProfileId: string;
  rootCssClass: string;
  knownLabel: string;
  unknownLabel: string;
  doneTitle: string;
  doneSubtitleTemplate: (known: number, unknown: number, total: number) => string;
};

const DEFAULT_PRESENTATION: FlashcardReviewPresentationProfile = {
  coreLayoutProfileId: 'flashcard_shell',
  detailWidgetId: 'flashcard_flip',
  resultProfileId: 'flashcard_session_result',
  rootCssClass: 'flashcard-layout--flashcard_shell',
  knownLabel: 'Biết',
  unknownLabel: 'Chưa thuộc',
  doneTitle: 'Hoàn thành lượt luyện',
  doneSubtitleTemplate: (known, unknown, total) =>
    `${known} từ biết · ${unknown} từ chưa thuộc · ${total} từ`,
};

export function resolveFlashcardReviewPresentationFromSessionConfig(
  sessionConfig: FlashcardReviewSessionConfigLike | null | undefined,
): FlashcardReviewPresentationProfile {
  if (!sessionConfig?.presentation) {
    return DEFAULT_PRESENTATION;
  }

  const { presentation } = sessionConfig;
  return {
    coreLayoutProfileId: presentation.coreLayoutProfileId,
    detailWidgetId: presentation.detailWidgetId,
    resultProfileId: presentation.resultProfileId,
    rootCssClass: `flashcard-layout--${presentation.coreLayoutProfileId}`,
    knownLabel: DEFAULT_PRESENTATION.knownLabel,
    unknownLabel: DEFAULT_PRESENTATION.unknownLabel,
    doneTitle: DEFAULT_PRESENTATION.doneTitle,
    doneSubtitleTemplate: DEFAULT_PRESENTATION.doneSubtitleTemplate,
  };
}
