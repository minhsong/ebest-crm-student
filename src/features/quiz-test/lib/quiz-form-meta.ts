import type { QuizFormItemPayload } from '@/features/quiz-test/types';

function readTagKeys(taxonomyRefs: unknown): string[] {
  if (!taxonomyRefs || typeof taxonomyRefs !== 'object') return [];
  const raw = (taxonomyRefs as Record<string, unknown>).tagKeys;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((s) => s.trim());
}

interface QuestionSnapshotTags {
  tags?: Array<{ code?: string; name?: string; path?: string; pathNames?: string[] }>;
}

/** Đọc tags từ questionSnapshot.tags (Quiz Tag System mới) */
function readTagsFromQuestionSnapshot(q: QuestionSnapshotTags): string[] {
  const tags = q?.tags;
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => t?.name || t?.code)
    .map((t) => t.name || t.code || '');
}

/** Các taxonomy tag (exam:toeic, …) có trên các câu của đề, đã khử trùng. */
export function collectFormTagKeysFromItems(items: QuizFormItemPayload[]): string[] {
  const s = new Set<string>();
  for (const row of items) {
    const q = row.questionSnapshot;
    if (!q) continue;
    // Legacy: đọc từ taxonomyRefs.tagKeys
    for (const k of readTagKeys(q.taxonomyRefs)) {
      s.add(k);
    }
    // Mới: đọc từ questionSnapshot.tags (pathNames)
    for (const tagName of readTagsFromQuestionSnapshot(q as QuestionSnapshotTags)) {
      s.add(tagName);
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b, 'vi'));
}

/** `type` form từ CRM (`original` | `random` | …). */
export function formatQuizFormTypeVi(type?: string | null): string | null {
  if (type == null || String(type).trim() === '') return null;
  const t = String(type).trim().toLowerCase();
  if (t === 'original') return 'Đề gốc';
  if (t === 'random') return 'Đề xáo câu';
  return String(type).trim();
}

export function formatQuizDurationSummary(durationSeconds: number): string {
  const sec = Math.max(0, Math.floor(Number(durationSeconds) || 0));
  const m = Math.floor(sec / 60);
  if (m <= 0 && sec > 0) return `Thời lượng làm bài: dưới 1 phút`;
  return `Thời lượng làm bài: ${m} phút`;
}
