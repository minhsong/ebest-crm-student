import type { QuizFormItemPayload } from '@/features/quiz-test/types';

interface QuestionSnapshotTags {
  tags?: Array<{ code?: string; name?: string; path?: string; pathNames?: string[] }>;
}

function readTagsFromQuestionSnapshot(q: QuestionSnapshotTags): string[] {
  const tags = q?.tags;
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => t?.name || t?.code)
    .map((t) => t.name || t.code || '');
}

/** Tag hiển thị gom từ questionSnapshot.tags trên các câu của đề. */
export function collectFormTagKeysFromItems(items: QuizFormItemPayload[]): string[] {
  const s = new Set<string>();
  for (const row of items) {
    const q = row.questionSnapshot;
    if (!q) continue;
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
