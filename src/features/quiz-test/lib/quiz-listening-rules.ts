/**
 * Quy tắc listening (§10.1 / §10.6) — **cùng semantics** với:
 * - `ebest-crm-api/src/test-quiz/test-quiz-listening-section.helpers.ts`
 * - `ebest-social-gateway/src/quiz-runtime/quiz-listening.util.ts`
 *
 * Khi đổi logic đếm autoplay / repeatCount, cập nhật đồng thời cả ba nơi (hoặc tách package dùng chung).
 */

export function getAudioItemsFromQuestionContent(content: unknown): unknown[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return [];
  const media = (content as Record<string, unknown>).media;
  if (!media || typeof media !== 'object' || Array.isArray(media)) return [];
  const audio = (media as Record<string, unknown>).audio;
  return Array.isArray(audio) ? audio : [];
}

/**
 * Đơn vị “autoplay listening”: có ≥1 track audio và tồn tại phần tử `autoPlay !== false`
 * (mặc định coi như true khi thiếu field) — §10.1.
 */
export function listeningUnitHasAutoplayEligibleAudio(content: unknown): boolean {
  const arr = getAudioItemsFromQuestionContent(content);
  if (!arr.length) return false;
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const ap = (raw as Record<string, unknown>).autoPlay;
    if (ap === false) continue;
    return true;
  }
  return false;
}

/** §10.6 — repeatCount trên content (hoặc uiHints.repeatCount); tối thiểu 1, tối đa 1000. */
export function getListeningRepeatCountFromContent(content: unknown): number {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return 1;
  const c = content as Record<string, unknown>;
  let raw: unknown = c.repeatCount;
  if (raw == null && c.uiHints && typeof c.uiHints === 'object' && !Array.isArray(c.uiHints)) {
    raw = (c.uiHints as Record<string, unknown>).repeatCount;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(1000, Math.floor(n));
}
