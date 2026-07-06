'use client';

import type { ReactNode } from 'react';
import { Alert, Empty } from 'antd';
import { LoadingState } from '@/components/layout';
import type { LeadTestResultSummary } from '@/lib/lead-portal/types';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { MockTestOnlineInProgressResultCard } from './MockTestOnlineInProgressResultCard';
import { MockTestResultCard } from './MockTestResultCard';

type Props = {
  items: LeadTestResultSummary[];
  loading: boolean;
  error: string | null;
  emptyDescription?: string;
  footer?: ReactNode;
  /** Bài thi online đang làm dở — hiển thị đầu danh sách (BL-Q2). */
  inProgressAttemptStatus?: MockTestOnlineAttemptStatus | null;
};

/** Danh sách kết quả thi thử — loading / error / empty / list (presentational). */
export function MockTestResultsPanel({
  items,
  loading,
  error,
  emptyDescription = 'Chưa có kết quả nào.',
  footer,
  inProgressAttemptStatus = null,
}: Props) {
  const showInProgress = Boolean(
    inProgressAttemptStatus?.activeInExam?.resumeAllowed,
  );
  const inExamInList = items.some((item) => item.status === 'in_exam');
  const showInProgressCard = showInProgress && !inExamInList;

  if (loading) {
    return <LoadingState tip="Đang tải kết quả..." />;
  }

  const hasListContent = showInProgressCard || items.length > 0;

  return (
    <>
      {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}
      {!loading && !error && !hasListContent ? (
        <Empty description={emptyDescription} />
      ) : null}
      {hasListContent ? (
        <div className="flex flex-col gap-3">
          {showInProgressCard && inProgressAttemptStatus ? (
            <MockTestOnlineInProgressResultCard
              attemptStatus={inProgressAttemptStatus}
            />
          ) : null}
          {items.map((item) => (
            <MockTestResultCard
              key={item.registrationId}
              item={item}
              inExamAttemptStatus={inProgressAttemptStatus}
            />
          ))}
        </div>
      ) : null}
      {footer}
    </>
  );
}
