import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';

/**
 * Quy tắc listening — **cùng semantics** SECTION_LISTENING_POLICY.md
 * Mirror: ebest-crm-api/test-quiz-section-listening-policy.helpers.ts
 *         ebest-social-gateway/quiz-listening.util.ts
 */

/** Đếm ngược (giây) trước auto-play khi vào section nghe — chờ UI render + chuẩn bị. */
export const SECTION_LISTENING_AUTO_START_COUNTDOWN_SECONDS = 10;

export function getAudioItemsFromQuestionContent(content: unknown): unknown[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return [];
  const media = (content as Record<string, unknown>).media;
  if (!media || typeof media !== 'object' || Array.isArray(media)) return [];
  const audio = (media as Record<string, unknown>).audio;
  return Array.isArray(audio) ? audio : [];
}

export function contentHasListeningAudio(content: unknown): boolean {
  return getAudioItemsFromQuestionContent(content).length > 0;
}

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

export function quizSectionListeningStorageKey(sectionId: number): string {
  return `section:${sectionId}`;
}

export function isKnownListeningRemaining(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

type PreviewLikeItem = {
  formItemId: number;
  sectionId?: number | null;
  questionSnapshot?: { content?: unknown } | null;
  sourceGroupId?: number | null;
};

type PreviewLikeGroupBundle = {
  sourceGroupId: number;
  bundleSnapshot?: { content?: unknown } | null;
};

type PublishedSectionRow = {
  sectionId?: number;
  listeningRepeatCount?: number | null;
  listeningAutoPlay?: boolean | null;
};

function parsePreviewLikeItem(raw: Record<string, unknown>): PreviewLikeItem | null {
  const sectionId = Number(raw.sectionId);
  if (!Number.isFinite(sectionId)) return null;
  return {
    formItemId: Number(raw.formItemId),
    sectionId,
    questionSnapshot:
      raw.questionSnapshot &&
      typeof raw.questionSnapshot === 'object' &&
      !Array.isArray(raw.questionSnapshot)
        ? (raw.questionSnapshot as PreviewLikeItem['questionSnapshot'])
        : undefined,
    sourceGroupId: raw.sourceGroupId != null ? Number(raw.sourceGroupId) : null,
  };
}

type FormListeningParseContext = {
  bundleByGroupId: Map<number, PreviewLikeGroupBundle>;
  sectionMetaById: Map<number, PublishedSectionRow>;
  itemsBySection: Map<number, PreviewLikeItem[]>;
};

function parseFormListeningContext(
  form: QuizPublishedFormPayload | Record<string, unknown> | null | undefined,
): FormListeningParseContext {
  const bundleByGroupId = new Map<number, PreviewLikeGroupBundle>();
  const sectionMetaById = new Map<number, PublishedSectionRow>();
  const itemsBySection = new Map<number, PreviewLikeItem[]>();

  if (!form || typeof form !== 'object') {
    return { bundleByGroupId, sectionMetaById, itemsBySection };
  }

  const rawBundles = Array.isArray(form.groupBundles) ? form.groupBundles : [];
  for (const gb of rawBundles) {
    if (!gb || typeof gb !== 'object' || Array.isArray(gb)) continue;
    const g = gb as PreviewLikeGroupBundle;
    const gid = Number(g.sourceGroupId);
    if (!Number.isFinite(gid)) continue;
    bundleByGroupId.set(gid, g);
  }

  const rawSections = Array.isArray(form.sections) ? form.sections : [];
  for (const raw of rawSections) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const s = raw as PublishedSectionRow;
    const sid = Number(s.sectionId);
    if (!Number.isFinite(sid)) continue;
    sectionMetaById.set(sid, s);
  }

  const rawItems = Array.isArray(form.items) ? form.items : [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const item = parsePreviewLikeItem(raw as Record<string, unknown>);
    if (!item?.sectionId) continue;
    const arr = itemsBySection.get(item.sectionId) ?? [];
    arr.push(item);
    itemsBySection.set(item.sectionId, arr);
  }

  return { bundleByGroupId, sectionMetaById, itemsBySection };
}

function getContentForPreviewRow(
  row: PreviewLikeItem,
  bundleByGroupId: Map<number, PreviewLikeGroupBundle>,
): unknown | null {
  if (row.questionSnapshot) return row.questionSnapshot.content ?? null;
  const gid = Number(row.sourceGroupId);
  if (!Number.isFinite(gid)) return null;
  return bundleByGroupId.get(gid)?.bundleSnapshot?.content ?? null;
}

function collectAudioUnitContentsInSection(
  sectionRows: PreviewLikeItem[],
  bundleByGroupId: Map<number, PreviewLikeGroupBundle>,
): unknown[] {
  const out: unknown[] = [];
  for (const row of sectionRows) {
    const content = getContentForPreviewRow(row, bundleByGroupId);
    if (contentHasListeningAudio(content)) out.push(content);
  }
  return out;
}

function resolveSectionRepeatQuota(
  sectionMeta: { listeningRepeatCount?: number | null },
  audioUnitContents: unknown[],
): number {
  const raw = sectionMeta.listeningRepeatCount;
  if (raw != null) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.min(1000, Math.floor(n));
  }
  if (!audioUnitContents.length) return 1;
  return Math.min(...audioUnitContents.map((c) => getListeningRepeatCountFromContent(c)));
}

function classifySectionKind(
  sectionRows: PreviewLikeItem[],
  bundleByGroupId: Map<number, PreviewLikeGroupBundle>,
): 'exam' | 'listening' | 'invalid_mix' | 'invalid_empty' {
  if (!sectionRows.length) return 'invalid_empty';
  let withAudio = 0;
  let withoutAudio = 0;
  for (const row of sectionRows) {
    const content = getContentForPreviewRow(row, bundleByGroupId);
    if (contentHasListeningAudio(content)) withAudio += 1;
    else withoutAudio += 1;
  }
  if (withAudio > 0 && withoutAudio > 0) return 'invalid_mix';
  if (withAudio > 0) return 'listening';
  return 'exam';
}

export function buildRemainingPlaysByListeningUnitFromForm(
  form: QuizPublishedFormPayload | Record<string, unknown> | null | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  const { bundleByGroupId, sectionMetaById, itemsBySection } =
    parseFormListeningContext(form);

  for (const [sectionId, rows] of itemsBySection) {
    const kind = classifySectionKind(rows, bundleByGroupId);
    if (kind !== 'listening') continue;
    const audioUnits = collectAudioUnitContentsInSection(rows, bundleByGroupId);
    const meta = sectionMetaById.get(sectionId) ?? {};
    out[quizSectionListeningStorageKey(sectionId)] = resolveSectionRepeatQuota(
      meta,
      audioUnits,
    );
  }

  return out;
}

export function getSectionListeningQuotaFromForm(
  form: QuizPublishedFormPayload | Record<string, unknown> | null | undefined,
  sectionId: number,
): number | null {
  const key = quizSectionListeningStorageKey(sectionId);
  const v = buildRemainingPlaysByListeningUnitFromForm(form)[key];
  return isKnownListeningRemaining(v) ? v : null;
}

export function resolveSectionPlaybackModeFromForm(
  form: QuizPublishedFormPayload | Record<string, unknown> | null | undefined,
  sectionId: number,
): 'auto' | 'manual' | null {
  const { bundleByGroupId, sectionMetaById, itemsBySection } =
    parseFormListeningContext(form);
  const rows = itemsBySection.get(sectionId) ?? [];
  const kind = classifySectionKind(rows, bundleByGroupId);
  if (kind !== 'listening') return null;

  const sectionMeta = sectionMetaById.get(sectionId);
  const sectionAutoPlay =
    typeof sectionMeta?.listeningAutoPlay === 'boolean'
      ? sectionMeta.listeningAutoPlay
      : null;

  const audioUnits = collectAudioUnitContentsInSection(rows, bundleByGroupId);
  if (sectionAutoPlay === true) return 'auto';
  if (sectionAutoPlay === false) return 'manual';
  for (const content of audioUnits) {
    if (!listeningUnitHasAutoplayEligibleAudio(content)) return 'manual';
  }
  return 'auto';
}

export type SectionPlaybackMode = 'auto' | 'manual';
