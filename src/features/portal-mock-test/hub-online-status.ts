import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { isMockTestOnlineAttemptBlocked } from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';
import { buildMockTestOnlineExamReadyPath } from '@/lib/public-mock-test-online/mock-test-online-exam-url.util';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

export type MockTestHubOnlineState =
  | { kind: 'unknown' }
  | { kind: 'available'; label: string; href?: string }
  | { kind: 'resume'; label: string; href: string }
  | { kind: 'blocked'; label: string; href?: string };

/** Trạng thái gọn cho card Hub; không thay thế attempt gate thẩm quyền. */
export function resolveMockTestHubOnlineState(
  status: MockTestOnlineAttemptStatus | null,
): MockTestHubOnlineState {
  if (!status) return { kind: 'unknown' };
  if (status.activeInExam?.resumeAllowed) {
    return {
      kind: 'resume',
      label: 'Có bài đang làm dở',
      href: PORTAL_MOCK_TEST_ROUTES.results,
    };
  }
  if (status.activeReady?.resumeAllowed) {
    const regId = status.activeReady.registrationId;
    return {
      kind: 'resume',
      label: 'Đã mở khóa — sẵn sàng bắt đầu',
      href:
        regId != null && regId >= 1
          ? buildMockTestOnlineExamReadyPath({ registrationId: regId })
          : PORTAL_MOCK_TEST_ROUTES.onlineSelect,
    };
  }
  if (isMockTestOnlineAttemptBlocked(status)) {
    return {
      kind: 'blocked',
      label: 'Đã hết lượt online',
      href: PORTAL_MOCK_TEST_ROUTES.results,
    };
  }
  return {
    kind: 'available',
    label: `Còn ${Math.max(0, status.remaining)} lượt`,
  };
}
