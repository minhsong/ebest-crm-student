/** Khớp server `student-submission-mime.util.ts` — chỉ nhận media file. */

export function isAllowedStudentSubmissionMime(
  mime: string | undefined | null,
): boolean {
  const m = (mime ?? '').trim().toLowerCase();
  if (!m) return false;
  if (m.startsWith('audio/')) return true;
  if (m.startsWith('video/')) return true;
  if (m.startsWith('image/')) return true;
  return false;
}
