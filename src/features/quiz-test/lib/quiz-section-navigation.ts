import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';
import {
  filterRenderableBlocksBySectionId,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';

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
