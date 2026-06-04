/**
 * Chính sách nộp bài portal — mirror API assignments/utils.
 */

export const EXTERNAL_LINK_SUBMISSION_MAX_BYTES = 2 * 1024 * 1024;
export const STUDENT_SUBMISSION_MAX_BYTES = 50 * 1024 * 1024;

export function isExternalLinkExerciseType(
  exerciseType?: string | null,
): boolean {
  return (exerciseType ?? "").trim().toLowerCase() === "external_link";
}

export function isAllowedStudentSubmissionMime(
  mime: string | undefined | null,
): boolean {
  const m = (mime ?? "").trim().toLowerCase();
  if (!m) return false;
  return (
    m.startsWith("audio/") ||
    m.startsWith("video/") ||
    m.startsWith("image/")
  );
}

export function isAllowedExternalLinkSubmissionMime(
  mime: string | undefined | null,
): boolean {
  return (mime ?? "").trim().toLowerCase().startsWith("image/");
}

export function getSubmissionMaxBytes(
  externalLinkImageOnly: boolean,
): number {
  return externalLinkImageOnly
    ? EXTERNAL_LINK_SUBMISSION_MAX_BYTES
    : STUDENT_SUBMISSION_MAX_BYTES;
}

export function getSubmissionMaxBytesLabel(
  externalLinkImageOnly: boolean,
): string {
  return externalLinkImageOnly ? "2MB" : "50MB";
}

export function isSubmissionMimeAllowed(
  mime: string,
  externalLinkImageOnly: boolean,
): boolean {
  return externalLinkImageOnly
    ? isAllowedExternalLinkSubmissionMime(mime)
    : isAllowedStudentSubmissionMime(mime);
}

export function getFileInputAccept(externalLinkImageOnly: boolean): string {
  return externalLinkImageOnly ? "image/*" : "audio/*,image/*,video/*";
}
