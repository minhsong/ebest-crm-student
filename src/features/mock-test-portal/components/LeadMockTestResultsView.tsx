'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { PageCard, PageHeader } from '@/components/layout';
import { LeadConsultCta } from '@/components/lead-portal/LeadConsultCta';
import { MockTestOnlineAttemptLimitAlert } from '@/components/public-mock-test-online/MockTestOnlineAttemptLimitAlert';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { usePortalSiteLinks } from '@/hooks/use-portal-site-links';
import { MockTestResultsPanel } from './MockTestResultsPanel';
import { useLeadMockTestResultsPage } from '../hooks/useLeadMockTestResultsPage';
import { usePortalMockTestInExamStatus } from '../hooks/useLeadMockTestInExamStatus';

type Props = {
  notice?: string | null;
};

export function LeadMockTestResultsView({ notice }: Props) {
  const { items, loading, error, authReady } = useLeadMockTestResultsPage();
  const { status: inExamStatus, loading: inExamLoading } =
    usePortalMockTestInExamStatus(authReady);
  const { siteLinks } = usePortalSiteLinks();

  const showInProgress =
    !inExamLoading && Boolean(inExamStatus?.activeInExam?.resumeAllowed);

  const hasScoredResult = items.some((item) => item.trackingPhase === 'done');

  return (
    <>
      <PageHeader
        title="Lịch sử thi thử"
        description={
          <>
            Theo dõi buổi thi tại trung tâm và bài thi online.{' '}
            <Link href={PORTAL_MOCK_TEST_ROUTES.onlineStart}>
              Thi online mới
            </Link>
          </>
        }
      />
      <PageCard>
        <MockTestOnlineAttemptLimitAlert
          attemptStatus={inExamStatus}
          forced={notice === 'attempt_limit'}
          variant="warning"
        />
        <MockTestResultsPanel
          items={items}
          loading={loading}
          error={error}
          inProgressAttemptStatus={showInProgress ? inExamStatus : null}
        />
        {hasScoredResult ? (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
            <p className="mb-2 flex items-center gap-2 text-sm text-gray-800">
              <BulbOutlined className="text-blue-500" />
              Dựa trên kết quả thi, xem khóa học gợi ý cho bạn.
            </p>
            <Link href="/lead/courses#recommendations">
              <Button type="primary" size="small">
                Xem gợi ý khóa học
              </Button>
            </Link>
          </div>
        ) : null}
        {notice === 'attempt_limit' ? (
          <LeadConsultCta
            siteLinks={siteLinks}
            title="Cần tư vấn thêm lộ trình học?"
            className="mt-4 rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3"
          />
        ) : null}
      </PageCard>
      <div className="mt-4">
        <Link href={PORTAL_MOCK_TEST_ROUTES.hub}>
          <Button>Về trang Thi thử</Button>
        </Link>
      </div>
    </>
  );
}
