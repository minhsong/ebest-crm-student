/**
 * Giá trị số đồng bộ với CRM (class_sessions.status, classes.status, …).
 * Single source of truth — tránh magic number trong UI.
 */

export const CRM_CLASS_SESSION_STATUS = {
  DRAFT: 1,
  READY: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
} as const;

export const CRM_CLASS_STATUS = {
  PLANNING: 1,
  READY: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  DROPPED: 6,
} as const;

export const CRM_ATTENDANCE_STATUS = {
  PRESENT: 1,
  ABSENT: 2,
  EXCUSED: 3,
} as const;

export const CRM_ASSIGNMENT_RESULT_STATUS = {
  PENDING: 1,
  GRADED: 2,
  SUBMITTED: 3,
} as const;
