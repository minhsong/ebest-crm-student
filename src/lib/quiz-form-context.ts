/**
 * Ngữ cảnh làm bài theo form — không phụ thuộc query URL (tránh user xóa assignmentId).
 */

export type QuizFormContextStored = {
  mode: 'assignment' | 'practice';
  assignmentId?: number;
};

const storageKey = (formPublicId: string) =>
  `ebest_quiz_ctx_${formPublicId.trim()}`;

export function setQuizFormContext(
  formPublicId: string,
  ctx: QuizFormContextStored,
): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(formPublicId), JSON.stringify(ctx));
  } catch {
    /* ignore quota */
  }
}

export function getQuizFormContext(
  formPublicId: string,
): QuizFormContextStored | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(formPublicId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizFormContextStored;
    if (parsed?.mode !== 'assignment' && parsed?.mode !== 'practice') return null;
    if (
      parsed.mode === 'assignment' &&
      (parsed.assignmentId == null || !Number.isFinite(parsed.assignmentId))
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuizFormContext(formPublicId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(storageKey(formPublicId));
  } catch {
    /* ignore */
  }
}
