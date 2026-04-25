import type { StudentAssignmentDetail } from '@/types/student-assignment-detail';

function pickRecord(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object') return null;
  return raw as Record<string, unknown>;
}

/**
 * Chuẩn hóa JSON từ API — luôn có `result` (API có thể thiếu hoặc bọc wrapper).
 */
export function normalizeStudentAssignmentDetail(
  raw: unknown,
): StudentAssignmentDetail | null {
  let o = pickRecord(raw);
  if (!o) return null;

  if (
    o.data != null &&
    typeof o.data === 'object' &&
    'assignmentId' in (o.data as object)
  ) {
    o = o.data as Record<string, unknown>;
  }

  const assignmentId = Number(o.assignmentId);
  if (!Number.isFinite(assignmentId)) return null;

  const res = pickRecord(o.result);
  const scoreRaw = res?.scoreDisplay;
  const scoreDisplay =
    typeof scoreRaw === 'string'
      ? scoreRaw
      : typeof scoreRaw === 'number'
        ? String(scoreRaw)
        : null;

  const attachments = Array.isArray(o.attachments)
    ? (o.attachments as StudentAssignmentDetail['attachments'])
    : [];

  const studentUploadEnabled =
    typeof o.studentUploadEnabled === 'boolean' ? o.studentUploadEnabled : undefined;
  const studentUploadMaxFiles =
    typeof o.studentUploadMaxFiles === 'number' ? o.studentUploadMaxFiles : undefined;
  const submission =
    o.submission != null && typeof o.submission === 'object'
      ? (o.submission as StudentAssignmentDetail['submission'])
      : undefined;

  return {
    assignmentId,
    title: typeof o.title === 'string' ? o.title : '',
    type: typeof o.type === 'number' ? o.type : 0,
    typeLabel: typeof o.typeLabel === 'string' ? o.typeLabel : '',
    exerciseType:
      typeof o.exerciseType === 'string' ? o.exerciseType : null,
    exerciseTypeLabel:
      typeof o.exerciseTypeLabel === 'string'
        ? o.exerciseTypeLabel
        : null,
    scoringType:
      typeof o.scoringType === 'number' ? o.scoringType : null,
    scoringTypeLabel:
      typeof o.scoringTypeLabel === 'string' ? o.scoringTypeLabel : null,
    content: typeof o.content === 'string' ? o.content : null,
    deadline: typeof o.deadline === 'string' ? o.deadline : null,
    attachments,
    classSessionTitle:
      typeof o.classSessionTitle === 'string'
        ? o.classSessionTitle
        : null,
    courseSessionTitle:
      typeof o.courseSessionTitle === 'string'
        ? o.courseSessionTitle
        : null,
    studentUploadEnabled,
    studentUploadMaxFiles,
    submission,
    result: {
      resultStatus:
        typeof res?.resultStatus === 'number' ? res.resultStatus : null,
      scoreDisplay,
    },
  };
}
