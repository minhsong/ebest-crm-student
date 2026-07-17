import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { isMockTestOnlineAttemptBlocked } from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';

export type MockTestHubOnlineState =
  | { kind: 'unknown' }
  | { kind: 'available'; label: string }
  | { kind: 'resume'; label: string }
  | { kind: 'blocked'; label: string };

/** Trạng thái gọn cho card Hub; không thay thế attempt gate thẩm quyền. */
export function resolveMockTestHubOnlineState(
  status: MockTestOnlineAttemptStatus | null,
): MockTestHubOnlineState {
  if (!status) return { kind: 'unknown' };
  if (status.activeInExam?.resumeAllowed) {
    return { kind: 'resume', label: 'Có bài đang làm dở' };
  }
  if (isMockTestOnlineAttemptBlocked(status)) {
    return { kind: 'blocked', label: 'Đã hết lượt online' };
  }
  return {
    kind: 'available',
    label: `Còn ${Math.max(0, status.remaining)} lượt`,
  };
}
