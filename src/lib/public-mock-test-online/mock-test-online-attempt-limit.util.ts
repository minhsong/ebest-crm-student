import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';

/** Copy Alert hết lượt — dùng chung select-exam + /lead/tests. */
export function getMockTestOnlineAttemptLimitDescription(
  status: MockTestOnlineAttemptStatus | null | undefined,
): string {
  if (!status) {
    return 'Bạn đã sử dụng hết số lần thi thử online. Liên hệ Ebest để được tư vấn thêm.';
  }

  if (
    status.sessionCap &&
    status.sessionCap.sessionRemaining <= 0 &&
    (status.globalRemaining ?? status.remaining) > 0
  ) {
    return `Bạn đã dùng hết ${status.sessionCap.maxAttemptsPerPhone} lượt cho chiến dịch này. Hãy chọn chiến dịch khác cùng loại đề hoặc liên hệ Ebest.`;
  }

  return `Bạn đã sử dụng ${status.verifiedCount}/${status.maxAttempts} lượt cho loại đề này. Vui lòng liên hệ Ebest để được tư vấn thêm.`;
}

export function isMockTestOnlineAttemptBlocked(
  status: MockTestOnlineAttemptStatus | null | undefined,
): boolean {
  if (!status) return false;
  if (status.activeInExam?.resumeAllowed) return false;
  return status.remaining <= 0;
}
