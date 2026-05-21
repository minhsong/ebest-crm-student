import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';

/** Nhãn ngắn trạng thái bài tập trên danh sách. */
export function assignmentResultShort(resultStatus: number | null): string {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'Đã chấm';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'Đã nộp';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.PENDING) return 'Chưa nộp';
  return '—';
}

export function assignmentResultTagColor(
  resultStatus: number | null,
): 'blue' | 'processing' | 'default' {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'blue';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'processing';
  return 'default';
}
