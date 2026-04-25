/** Khớp server `student-submission-mime.util.ts` — kiểm tra sớm trên client. */
const EXTRA_ALLOWED = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export function isAllowedStudentSubmissionMime(
  mime: string | undefined | null,
): boolean {
  const m = (mime ?? '').trim().toLowerCase();
  if (!m) return false;
  if (m.startsWith('audio/')) return true;
  if (m.startsWith('image/')) return true;
  if (m.startsWith('video/')) return true;
  return EXTRA_ALLOWED.has(m);
}
