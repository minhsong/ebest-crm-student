import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';
import { extractQuizAudioTracks, type QuizAudioTrack } from '@/features/quiz-test/lib/quiz-content-audio';
import { contentHasListeningAudio } from '@/features/quiz-test/lib/quiz-listening-rules';
import type { QuizFormSectionDemoSample } from '@/features/quiz-test/types';

export type SectionListeningQueueItem = {
  /** formItemId (câu đơn) hoặc parentFormItemId (bundle) — highlight + anchor. */
  highlightKey: string;
  tracks: QuizAudioTrack[];
};

export const SECTION_INTRO_DEMO_HIGHLIGHT_KEY = 'intro-demo';

/** Prepend audio từ demoSample (hướng dẫn) — không phải câu hỏi. */
export function buildSectionListeningQueue(
  blocks: QuizRenderableBlock[],
  demoSample?: QuizFormSectionDemoSample | null,
): SectionListeningQueueItem[] {
  const out: SectionListeningQueueItem[] = [];
  if (demoSample?.media && contentHasListeningAudio({ media: demoSample.media })) {
    const tracks = extractQuizAudioTracks({ media: demoSample.media });
    if (tracks.length) {
      out.push({
        highlightKey: SECTION_INTRO_DEMO_HIGHLIGHT_KEY,
        tracks,
      });
    }
  }
  for (const b of blocks) {
    if (b.kind === 'single') {
      const content = b.item.questionSnapshot?.content;
      if (!contentHasListeningAudio(content)) continue;
      const tracks = extractQuizAudioTracks(content);
      if (!tracks.length) continue;
      out.push({ highlightKey: String(b.item.formItemId), tracks });
      continue;
    }
    const content = b.bundleContent;
    if (!contentHasListeningAudio(content)) continue;
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
  demoSample?: QuizFormSectionDemoSample | null,
): FlatSectionListeningSegment[] {
  const out: FlatSectionListeningSegment[] = [];
  for (const item of buildSectionListeningQueue(blocks, demoSample)) {
    for (const t of item.tracks) {
      const url = typeof t.url === 'string' && t.url.trim() ? t.url.trim() : '';
      if (!url) continue;
      out.push({ url, highlightKey: item.highlightKey });
    }
  }
  return out;
}
