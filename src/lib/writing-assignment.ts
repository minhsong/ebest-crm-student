import type { StudentAssignmentAttachment } from '@/types/student-assignment-detail';

/** Giới hạn ký tự nội dung bài viết (HTML hoặc plain) — khớp API. */
export const WRITING_SUBMISSION_MAX_CHARS = 50_000;

export type WritingExerciseMode = 'free' | 'dictation';

export const WRITING_EXERCISE_MODES = {
  free: 'free',
  dictation: 'dictation',
} as const satisfies Record<string, WritingExerciseMode>;

export function parseWritingExerciseMode(raw: unknown): WritingExerciseMode {
  return raw === WRITING_EXERCISE_MODES.dictation
    ? WRITING_EXERCISE_MODES.dictation
    : WRITING_EXERCISE_MODES.free;
}

export function isWritingDictationMode(mode: unknown): boolean {
  return parseWritingExerciseMode(mode) === WRITING_EXERCISE_MODES.dictation;
}

export function isWritingExerciseType(
  exerciseType: string | null | undefined,
): boolean {
  return (exerciseType ?? '').trim().toLowerCase() === 'writing';
}

/** Chuẩn hóa xuống dòng — không trim (giữ dấu cách khi đang gõ / lưu nháp). */
export function normalizeWritingLineEndings(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n');
}

export function normalizeWritingPlainText(raw: unknown): string {
  return normalizeWritingLineEndings(raw).trimEnd();
}

/** Nộp chính thức — khớp API `normalizeWritingSubmissionText`. */
export function normalizeWritingSubmissionText(raw: unknown): string {
  return normalizeWritingLineEndings(raw).trim();
}

export function looksLikeWritingHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value.trim());
}

export function stripWritingHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function writingPlainTextForLimits(text: string): string {
  const normalized = normalizeWritingSubmissionText(text);
  if (!normalized) return '';
  return looksLikeWritingHtml(normalized)
    ? stripWritingHtmlToPlainText(normalized)
    : normalized;
}

export function countWritingWords(text: string): number {
  const plain = writingPlainTextForLimits(text);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/** TipTap trống thường là `<p></p>` — coi là chưa có nội dung. */
export function isWritingHtmlEmpty(html: string): boolean {
  return writingPlainTextForLimits(html).length === 0;
}

export function writingDraftStorageKey(assignmentId: number): string {
  return `writing-draft:${assignmentId}`;
}

export function readWritingDraftFromStorage(assignmentId: number): string {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeWritingLineEndings(
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
    const normalized = normalizeWritingLineEndings(text);
    if (isWritingHtmlEmpty(normalized)) {
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

export function isAudioAssignmentAttachment(
  item: Pick<StudentAssignmentAttachment, 'resourceKind' | 'mimeType' | 'url'>,
): boolean {
  if (item.resourceKind === 'audio') return true;
  const mime = item.mimeType?.trim().toLowerCase() ?? '';
  if (mime.startsWith('audio/')) return true;
  const url = item.url?.trim().toLowerCase() ?? '';
  return /\.(mp3|wav|m4a|ogg|aac|flac|webm)(\?|#|$)/.test(url);
}

export function pickDictationAudioAttachments(
  attachments: StudentAssignmentAttachment[] | undefined,
): StudentAssignmentAttachment[] {
  return (attachments ?? []).filter((item) => isAudioAssignmentAttachment(item));
}

/**
 * Tài liệu đính kèm hiển thị dưới form — bỏ audio đã đưa vào panel
 * «Nghe và chép» để tránh nút Phát mở popup chồng form.
 */
export function listAttachmentsExcludingDictationAudio(
  attachments: StudentAssignmentAttachment[] | undefined,
  writingMode: unknown,
): StudentAssignmentAttachment[] {
  const list = attachments ?? [];
  if (!isWritingDictationMode(writingMode)) return list;
  return list.filter((item) => !isAudioAssignmentAttachment(item));
}

export function getWritingEditorHint(
  mode: WritingExerciseMode,
  disablePaste: boolean,
): string {
  const pasteSuffix = disablePaste ? ' Không được dán từ clipboard.' : '';
  if (mode === WRITING_EXERCISE_MODES.dictation) {
    return `Nghe đoạn audio bên dưới và gõ lại (có thể dùng in đậm, danh sách…). Nội dung được lưu nháp tự động.${pasteSuffix}`;
  }
  return `Soạn bài bằng editor (in đậm, tiêu đề, danh sách, link). Nội dung được lưu nháp tự động; bấm Nộp bài khi hoàn thành.${pasteSuffix}`;
}
