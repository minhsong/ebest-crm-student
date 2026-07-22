'use client';

import Link from 'next/link';
import { Alert, Button } from 'antd';
import { PageCard, PageHeader } from '@/components/layout';
import { LeadConsultCta } from '@/components/lead-portal/LeadConsultCta';
import { MockTestOnlineAttemptLimitAlert } from '@/components/public-mock-test-online/MockTestOnlineAttemptLimitAlert';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { usePortalSiteLinks } from '@/hooks/use-portal-site-links';
import { MockTestResultsPanel } from './MockTestResultsPanel';
import { useStudentMockTestResultsPage } from '../hooks/useStudentMockTestResultsPage';
import { usePortalMockTestInExamStatus } from '../hooks/useLeadMockTestInExamStatus';

type Props = {
  notice?: string | null;
};

export function StudentMockTestResultsView({ notice }: Props) {
  const { items, loading, error } = useStudentMockTestResultsPage();
  const {
    status: inExamStatus,
    loading: inExamLoading,
    error: inExamError,
  } = usePortalMockTestInExamStatus(true);
  const { siteLinks } = usePortalSiteLinks();
  const showInProgress =
    !inExamLoading && Boolean(inExamStatus?.activeInExam?.resumeAllowed);

  return (
    <>
      <PageHeader
        title="Lịch sử thi thử"
        description={
          <>
            Lịch sử thi online và đăng ký tại trung tâm.{' '}
            <Link href={PORTAL_MOCK_TEST_ROUTES.onlineStart}>
              Thi online mới
            </Link>
          </>
        }
      />
      <PageCard>
        {inExamError ? (
          <Alert
            className="!mb-4"
            type="warning"
            showIcon
            message="Không kiểm tra được bài đang làm"
            description={inExamError}
          />
        ) : null}
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
