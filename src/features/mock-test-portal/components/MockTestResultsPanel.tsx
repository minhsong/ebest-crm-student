'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Alert, Button, Empty } from 'antd';
import { LoadingState } from '@/components/layout';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import type { LeadTestResultSummary } from '@/lib/lead-portal/types';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { MockTestOnlineInProgressResultCard } from './MockTestOnlineInProgressResultCard';
import { MockTestResultCard } from './MockTestResultCard';

const DEFAULT_EMPTY_DESCRIPTION = (
  <>
    Bạn chưa thử sức với bài thi thử nào. Hãy làm bài đầu tiên của bạn{' '}
    <Link href={PORTAL_MOCK_TEST_ROUTES.onlineStart} className="font-medium text-blue-600">
      tại đây
    </Link>
    .
  </>
);

type Props = {
  items: LeadTestResultSummary[];
  loading: boolean;
  error: string | null;
  emptyDescription?: ReactNode;
  footer?: ReactNode;
  /** Bài thi online đang làm dở — hiển thị đầu danh sách (BL-Q2). */
  inProgressAttemptStatus?: MockTestOnlineAttemptStatus | null;
};

/** Danh sách kết quả thi thử — loading / error / empty / list (presentational). */
export function MockTestResultsPanel({
  items,
  loading,
  error,
  emptyDescription = DEFAULT_EMPTY_DESCRIPTION,
  footer,
  inProgressAttemptStatus = null,
}: Props) {
  const showInProgress = Boolean(
    inProgressAttemptStatus?.activeInExam?.resumeAllowed ||
      inProgressAttemptStatus?.activeReady?.resumeAllowed,
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
        <Empty description={emptyDescription}>
          <Link href={PORTAL_MOCK_TEST_ROUTES.onlineStart}>
            <Button type="primary">Làm bài thi thử online</Button>
          </Link>
        </Empty>
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
