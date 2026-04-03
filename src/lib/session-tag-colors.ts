import {
  CRM_ATTENDANCE_STATUS,
  CRM_CLASS_SESSION_STATUS,
  CRM_CLASS_STATUS,
} from '@/lib/crm-enums';

/** Màu Tag Ant Design cho trạng thái buổi học (CRM class_sessions.status). */
export function antdTagColorForClassSessionStatus(status: number): string {
  if (status === CRM_CLASS_SESSION_STATUS.CANCELLED) return 'error';
  if (status === CRM_CLASS_SESSION_STATUS.COMPLETED) return 'default';
  if (status === CRM_CLASS_SESSION_STATUS.IN_PROGRESS) return 'processing';
  if (status === CRM_CLASS_SESSION_STATUS.READY) return 'blue';
  return 'default';
}

/** Màu Tag cho trạng thái lớp (classes.status) — tiêu đề khối lịch. */
export function antdTagColorForClassStatus(classStatus: number): string {
  if (classStatus === CRM_CLASS_STATUS.IN_PROGRESS) return 'processing';
  if (classStatus === CRM_CLASS_STATUS.READY) return 'blue';
  return 'default';
}

export function antdTagColorForAttendance(status: number): string {
  if (status === CRM_ATTENDANCE_STATUS.PRESENT) return 'success';
  if (status === CRM_ATTENDANCE_STATUS.EXCUSED) return 'orange';
  if (status === CRM_ATTENDANCE_STATUS.ABSENT) return 'error';
  return 'default';
}
