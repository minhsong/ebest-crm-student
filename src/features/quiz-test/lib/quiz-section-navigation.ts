import type {
  QuizFormSectionPayload,
  QuizPublishedFormPayload,
} from '@/features/quiz-test/types';
import {
  filterRenderableBlocksBySectionId,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import { sortQuizFormSections } from '@/features/quiz-test/lib/quiz-section-meta';

/** `id` DOM ổn định theo key câu (formItemId hoặc `parent::child`) — §11.4 / §11.7. */
/** Đưa viewport về đầu khi đổi section — tránh giữ scroll của phần trước. */
export function scrollQuizAttemptPageToTop(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function quizAnchorDomId(rawKey: string): string {
  const safe = String(rawKey).replace(/[^a-zA-Z0-9:_-]/g, '_').replace(/:+/g, '-');
  return `quiz-q-${safe}`;
}

export type ScrollToQuizQuestionAnchorOptions = {
  delayMs?: number;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
};

/** Scroll tới anchor câu — trả hàm cleanup timer (dùng trong useEffect). */
export function scrollToQuizQuestionAnchor(
  formItemId: string,
  options?: ScrollToQuizQuestionAnchorOptions,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const delayMs = options?.delayMs ?? 80;
  const behavior = options?.behavior ?? 'smooth';
  const block = options?.block ?? 'start';
  const timer = window.setTimeout(() => {
    document
      .getElementById(quizAnchorDomId(formItemId))
      ?.scrollIntoView({ behavior, block });
  }, delayMs);

  return () => window.clearTimeout(timer);
}

export function getQuizQuestionScrollDelayMs(sectionCount: number): number {
  return sectionCount > 1 ? 350 : 80;
}

/** Mở rộng collapse section khi nhảy câu từ mục lục (trang kết quả). */
export function mergeQuizOutlineSectionExpandKeys(
  prevKeys: string[],
  sectionId: number,
  fallbackKeys: string[],
): string[] {
  const base = prevKeys.length > 0 ? prevKeys : fallbackKeys;
  const key = String(sectionId);
  return base.includes(key) ? base : [...base, key];
}

export function listAnchorKeysForBlock(block: QuizRenderableBlock): string[] {
  if (block.kind === 'single') return [String(block.item.formItemId)];
  return [String(block.parentFormItemId), ...block.items.map((it) => String(it.formItemId))];
}

/**
 * Tìm `sectionId` chứa anchor; không có `sections` trên form → `null` (toàn bộ một view).
 */
export function findSectionIdForAnchorKey(
  formPayload: QuizPublishedFormPayload | null | undefined,
  allBlocks: QuizRenderableBlock[],
  anchorKey: string,
): number | null {
  const sections = Array.isArray(formPayload?.sections) ? formPayload!.sections! : [];
  if (!sections.length) {
    for (const b of allBlocks) {
      if (listAnchorKeysForBlock(b).includes(anchorKey)) return null;
    }
    return null;
  }
  for (const sec of sections) {
    const sid = Number(sec.sectionId);
    if (!Number.isFinite(sid)) continue;
    const blocks = filterRenderableBlocksBySectionId(formPayload, allBlocks, sid);
    for (const b of blocks) {
      if (listAnchorKeysForBlock(b).includes(anchorKey)) return sid;
    }
  }
  return null;
}

export function isAnchorKeyInForm(
  allBlocks: QuizRenderableBlock[],
  anchorKey: string,
): boolean {
  return allBlocks.some((b) => listAnchorKeysForBlock(b).includes(anchorKey));
}

/** Query `section` / `question` — chỉ dùng trong phiên làm bài hiện tại. */
export function hasQuizAttemptNavigationParams(
  searchParams: Pick<URLSearchParams, 'has'>,
): boolean {
  return searchParams.has('section') || searchParams.has('question');
}

/** Bỏ vị trí section/câu — giữ các param khác (assignmentId, mode, …). */
export function stripQuizAttemptNavigationParams(
  searchParams: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  next.delete('section');
  next.delete('question');
  return next;
}

export function buildQuizAttemptPagePath(
  formPublicId: string,
  searchParams: URLSearchParams,
): string {
  const qs = searchParams.toString();
  return `/quiz-test/${formPublicId}${qs ? `?${qs}` : ''}`;
}

/** Route làm bài sau khi bỏ `section` / `question`. */
export function buildQuizAttemptPagePathWithoutNav(
  formPublicId: string,
  searchParams: URLSearchParams,
): string {
  return buildQuizAttemptPagePath(
    formPublicId,
    stripQuizAttemptNavigationParams(new URLSearchParams(searchParams.toString())),
  );
}

/** Mock test online — `?form=` thay vì path segment `/quiz-test/:id`. */
export function buildMockTestOnlineExamRunPagePath(
  formPublicId: string,
  searchParams: URLSearchParams,
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set('form', formPublicId);
  const qs = params.toString();
  return `/mock-test-online/exam/run${qs ? `?${qs}` : ''}`;
}

export function buildMockTestOnlineExamRunPagePathWithoutNav(
  formPublicId: string,
  searchParams: URLSearchParams,
): string {
  return buildMockTestOnlineExamRunPagePath(
    formPublicId,
    stripQuizAttemptNavigationParams(new URLSearchParams(searchParams.toString())),
  );
}

function isSectionIdOnForm(
  sections: QuizFormSectionPayload[],
  sectionId: number,
): boolean {
  return sections.some((s) => Number(s.sectionId) === sectionId);
}

/** Section đang hiển thị: URL → initialSectionId → phần đầu. */
export function resolveQuizAttemptActiveSectionId(
  sections: QuizFormSectionPayload[],
  options: {
    sectionFromUrl?: string | null;
    initialSectionId?: number;
    /** Lần làm mới — bỏ qua ?section còn từ attempt trước. */
    ignoreUrlNavigation?: boolean;
  } = {},
): number | null {
  const sorted = sortQuizFormSections(sections);
  if (!sorted.length) return null;
  const firstSectionId = Number(sorted[0]!.sectionId);

  if (!options.ignoreUrlNavigation) {
    const fromUrl = options.sectionFromUrl?.trim();
    const urlSectionId = fromUrl ? Number(fromUrl) : NaN;
    if (Number.isFinite(urlSectionId) && isSectionIdOnForm(sorted, urlSectionId)) {
      return urlSectionId;
    }
    const initial = options.initialSectionId;
    if (
      typeof initial === 'number' &&
      Number.isFinite(initial) &&
      isSectionIdOnForm(sorted, initial)
    ) {
      return initial;
    }
  }

  return firstSectionId;
}
