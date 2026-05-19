import { getAudioItemsFromQuestionContent } from '@/features/quiz-test/lib/quiz-listening-rules';

export type QuizAudioTrack = { url: string; autoPlay: boolean };

/** Lấy URL phát được từ snapshot (ưu tiên `url`, fallback rỗng). */
export function extractQuizAudioTracks(content: unknown): QuizAudioTrack[] {
  const arr = getAudioItemsFromQuestionContent(content);
  const out: QuizAudioTrack[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const u = (raw as Record<string, unknown>).url;
    const url = typeof u === 'string' && u.trim() ? u.trim() : '';
    if (!url) continue;
    const ap = (raw as Record<string, unknown>).autoPlay;
    const autoPlay = ap !== false;
    out.push({ url, autoPlay });
  }
  return out;
}
