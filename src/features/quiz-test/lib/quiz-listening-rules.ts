import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';

/**
 * Quy tắc listening (§10.1 / §10.6) — **cùng semantics** với: * - `ebest-crm-api/src/test-quiz/test-quiz-listening-section.helpers.ts`
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

/** Khớp gateway `quizSectionListeningStorageKey`. */
export function quizSectionListeningStorageKey(sectionId: number): string {
  return `section:${sectionId}`;
}

function resolveSectionIdFromRow(row: Record<string, unknown>): number {
  const sid = row.sectionId;
  if (typeof sid === 'number' && Number.isFinite(sid)) return sid;
  return 0;
}

/**
 * Map `remainingPlaysByListeningUnit` khi start attempt — khớp gateway
 * `buildRemainingPlaysByListeningUnitFromForm`.
 */
export function buildRemainingPlaysByListeningUnitFromForm(
  form: QuizPublishedFormPayload | Record<string, unknown> | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!form || typeof form !== 'object') return out;

  const rawItems = Array.isArray(form.items) ? form.items : [];
  const rawBundles = Array.isArray(form.groupBundles) ? form.groupBundles : [];
  const bundleByGroupId = new Map<number, Record<string, unknown>>();
  for (const gb of rawBundles) {
    if (!gb || typeof gb !== 'object' || Array.isArray(gb)) continue;
    const g = gb as Record<string, unknown>;
    const gid = Number(g.sourceGroupId);
    if (!Number.isFinite(gid)) continue;
    bundleByGroupId.set(gid, g);
  }

  type Acc = { sectionId: number; repeat: number };
  const bySection = new Map<number, Acc[]>();

  const pushListening = (sectionId: number, content: unknown) => {
    if (!listeningUnitHasAutoplayEligibleAudio(content)) return;
    const repeat = getListeningRepeatCountFromContent(content);
    const arr = bySection.get(sectionId) ?? [];
    arr.push({ sectionId, repeat });
    bySection.set(sectionId, arr);
  };

  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const row = raw as Record<string, unknown>;
    const sectionId = resolveSectionIdFromRow(row);
    const q =
      row.questionSnapshot &&
      typeof row.questionSnapshot === 'object' &&
      !Array.isArray(row.questionSnapshot)
        ? (row.questionSnapshot as Record<string, unknown>)
        : null;
    if (q) {
      pushListening(sectionId, q.content);
      continue;
    }
    const gid = Number(row.sourceGroupId);
    if (!Number.isFinite(gid)) continue;
    const g = bundleByGroupId.get(gid);
    const snap = g?.bundleSnapshot;
    const content =
      snap && typeof snap === 'object' && !Array.isArray(snap)
        ? (snap as Record<string, unknown>).content
        : undefined;
    pushListening(sectionId, content);
  }

  for (const [sectionId, accs] of bySection) {
    if (!accs.length) continue;
    out[quizSectionListeningStorageKey(sectionId)] = Math.min(
      ...accs.map((a) => a.repeat),
    );
  }
  return out;
}

/** Lượt nghe tối đa của một section (null nếu không có autoplay). */
export function getSectionListeningQuotaFromForm(
  form: QuizPublishedFormPayload | Record<string, unknown> | null | undefined,
  sectionId: number,
): number | null {
  const quota = buildRemainingPlaysByListeningUnitFromForm(form)[
    quizSectionListeningStorageKey(sectionId)
  ];
  return typeof quota === 'number' ? quota : null;
}
