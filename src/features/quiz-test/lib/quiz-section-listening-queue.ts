import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import { extractQuizAudioTracks, type QuizAudioTrack } from '@/features/quiz-test/lib/quiz-content-audio';
import { listeningUnitHasAutoplayEligibleAudio } from '@/features/quiz-test/lib/quiz-listening-rules';

export type SectionListeningQueueItem = {
  /** formItemId (câu đơn) hoặc parentFormItemId (bundle) — highlight + anchor. */
  highlightKey: string;
  tracks: QuizAudioTrack[];
};

/** Thứ tự = thứ tự block trong section (đồng bộ `filterRenderableBlocksBySectionId`). */
export function buildSectionListeningQueue(blocks: QuizRenderableBlock[]): SectionListeningQueueItem[] {
  const out: SectionListeningQueueItem[] = [];
  for (const b of blocks) {
    if (b.kind === 'single') {
      const content = b.item.questionSnapshot?.content;
      if (!listeningUnitHasAutoplayEligibleAudio(content)) continue;
      const tracks = extractQuizAudioTracks(content);
      if (!tracks.length) continue;
      out.push({ highlightKey: String(b.item.formItemId), tracks });
      continue;
    }
    const content = b.bundleContent;
    if (!listeningUnitHasAutoplayEligibleAudio(content)) continue;
    const tracks = extractQuizAudioTracks(content);
    if (!tracks.length) continue;
    out.push({ highlightKey: String(b.parentFormItemId), tracks });
  }
  return out;
}

export type FlatSectionListeningSegment = {
  url: string;
  highlightKey: string;
};

/** Phẳng hóa queue thành danh sách segment (một track = một phần tử). */
export function flattenSectionListeningQueue(
  blocks: QuizRenderableBlock[],
): FlatSectionListeningSegment[] {
  const out: FlatSectionListeningSegment[] = [];
  for (const item of buildSectionListeningQueue(blocks)) {
    for (const t of item.tracks) {
      const url = typeof t.url === 'string' && t.url.trim() ? t.url.trim() : '';
      if (!url) continue;
      out.push({ url, highlightKey: item.highlightKey });
    }
  }
  return out;
}
