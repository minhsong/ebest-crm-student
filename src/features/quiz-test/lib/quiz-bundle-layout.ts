/**
 * Layout split ngang cho bundle (iPad+ / Tailwind `md` ≥768px).
 * Spec: TEST_QUIZ_LOGIC_FOUNDATION §3.5 — mirror portal ↔ CRM (không share UI package).
 */

export const QUIZ_BUNDLE_SPLIT_MD =
  'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-4 md:items-start';

/** Max height + scroll cho từng pane khi split. */
export const QUIZ_BUNDLE_PANE_SCROLL_MD =
  'md:max-h-[calc(100dvh-11rem)] md:overflow-y-auto md:overscroll-contain md:pr-1';

const CARD_HIGHLIGHT =
  'border-orange-400 ring-2 ring-orange-500 ring-offset-2 bg-orange-50/30 transition-shadow duration-300';
const CARD_DEFAULT =
  'border-neutral-200 bg-neutral-50/40 hover:border-neutral-300';

/** Có stem HTML → bật split trên md+; không stem → luôn stack dọc. */
export function shouldSplitBundleLayout(stemHtml?: string | null): boolean {
  return Boolean(stemHtml?.trim());
}

export function quizBundleShellClassName(split: boolean): string {
  return split ? `flex flex-col gap-0 ${QUIZ_BUNDLE_SPLIT_MD}` : 'flex flex-col';
}

export function quizBundleStemPaneClassName(split: boolean): string | undefined {
  return split ? `min-w-0 ${QUIZ_BUNDLE_PANE_SCROLL_MD}` : undefined;
}

export function quizBundleQuestionsPaneClassName(split: boolean): string {
  return split
    ? `mt-3 flex min-w-0 flex-col gap-3 md:mt-0 ${QUIZ_BUNDLE_PANE_SCROLL_MD}`
    : 'mt-3 flex flex-col gap-3';
}

/** Preview CRM: gap nhỏ hơn runtime Card. */
export function quizBundlePreviewShellClassName(split: boolean): string {
  return split
    ? `flex flex-col gap-2 ${QUIZ_BUNDLE_SPLIT_MD}`
    : 'flex flex-col gap-2';
}

export function quizBundlePreviewPaneClassName(split: boolean): string | undefined {
  return split ? `min-w-0 ${QUIZ_BUNDLE_PANE_SCROLL_MD}` : undefined;
}

export function quizBundlePreviewQuestionsClassName(split: boolean): string {
  return split
    ? `space-y-2 min-w-0 ${QUIZ_BUNDLE_PANE_SCROLL_MD}`
    : 'space-y-2';
}

export function quizBundleCardClassName(listeningHighlight?: boolean): string {
  return listeningHighlight ? CARD_HIGHLIGHT : CARD_DEFAULT;
}

export function normalizeListeningRemaining(remaining?: number): number {
  return typeof remaining === 'number' && Number.isFinite(remaining) ? remaining : 0;
}

export type BundleListeningGateInput = {
  embedListeningPlayer: boolean;
  readOnly: boolean;
  hasReportCycle: boolean;
  hasUnitKey: boolean;
  contentEligible: boolean;
  trackCount: number;
  remaining: number;
};

/** Điều kiện gắn player ẩn + icon “có âm thanh” trên bundle cha. */
export function canEmbedBundleListeningPlayer(input: BundleListeningGateInput): boolean {
  return (
    input.embedListeningPlayer &&
    !input.readOnly &&
    input.hasReportCycle &&
    input.hasUnitKey &&
    input.contentEligible &&
    input.trackCount > 0 &&
    input.remaining > 0
  );
}
