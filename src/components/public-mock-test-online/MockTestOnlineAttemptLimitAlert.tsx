'use client';

import { Alert } from 'antd';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import {
  getMockTestOnlineAttemptLimitDescription,
  isMockTestOnlineAttemptBlocked,
} from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';

type Props = {
  attemptStatus?: MockTestOnlineAttemptStatus | null;
  className?: string;
  /** Mặc định `error` — `/lead/tests` dùng `warning`. */
  variant?: 'error' | 'warning';
  /** Hiển thị message chung (redirect `?notice=attempt_limit`). */
  forced?: boolean;
};

/** Alert hết lượt thi — SSOT copy (select-exam, /lead/tests). */
export function MockTestOnlineAttemptLimitAlert({
  attemptStatus = null,
  className = '!mb-4',
  variant = 'error',
  forced = false,
}: Props) {
  if (attemptStatus?.activeInExam?.resumeAllowed) return null;
  if (!forced && !isMockTestOnlineAttemptBlocked(attemptStatus)) return null;

  return (
    <Alert
      type={variant}
      showIcon
      className={className}
      message="Đã hết lượt thi thử online"
      description={getMockTestOnlineAttemptLimitDescription(attemptStatus)}
    />
  );
}
