/** Giới hạn ký tự nội dung bài viết — khớp API. */
export const WRITING_SUBMISSION_MAX_CHARS = 50_000;

export function isWritingExerciseType(
  exerciseType: string | null | undefined,
): boolean {
  return (exerciseType ?? '').trim().toLowerCase() === 'writing';
}

export function normalizeWritingPlainText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n').trimEnd();
}

export function countWritingWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function writingDraftStorageKey(assignmentId: number): string {
  return `writing-draft:${assignmentId}`;
}

export function readWritingDraftFromStorage(assignmentId: number): string {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeWritingPlainText(
      window.localStorage.getItem(writingDraftStorageKey(assignmentId)) ?? '',
    );
  } catch {
    return '';
  }
}

export function writeWritingDraftToStorage(
  assignmentId: number,
  text: string,
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = writingDraftStorageKey(assignmentId);
    const normalized = normalizeWritingPlainText(text);
    if (!normalized.trim()) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, normalized);
  } catch {
    // ignore quota / private mode
  }
}

export function clearWritingDraftFromStorage(assignmentId: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(writingDraftStorageKey(assignmentId));
  } catch {
    // ignore
  }
}
