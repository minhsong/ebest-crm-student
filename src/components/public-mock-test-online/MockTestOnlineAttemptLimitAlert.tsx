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
  /** Mặc định `error` — `/mock-test/results` dùng `warning`. */
  variant?: 'error' | 'warning';
  /**
   * Redirect `?notice=attempt_limit`.
   * Chỉ hiện khi đã có status (tránh flash generic rồi biến mất khi resume).
   */
  forced?: boolean;
};

/** Alert hết lượt thi — SSOT copy (select-exam, /mock-test/results). */
export function MockTestOnlineAttemptLimitAlert({
  attemptStatus = null,
  className = '!mb-4',
  variant = 'error',
  forced = false,
}: Props) {
  if (attemptStatus?.activeInExam?.resumeAllowed) return null;

  const blocked = isMockTestOnlineAttemptBlocked(attemptStatus);
  if (forced) {
    // Chưa load status → đợi (tránh flash copy generic).
    if (attemptStatus == null) return null;
    if (!blocked) return null;
  } else if (!blocked) {
    return null;
  }

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
