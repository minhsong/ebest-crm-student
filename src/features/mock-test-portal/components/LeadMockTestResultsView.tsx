'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { PageCard, PageHeader } from '@/components/layout';
import { LeadConsultCta } from '@/components/lead-portal/LeadConsultCta';
import { MockTestOnlineAttemptLimitAlert } from '@/components/public-mock-test-online/MockTestOnlineAttemptLimitAlert';
import { usePortalSiteLinks } from '@/hooks/use-portal-site-links';
import { MockTestResultsPanel } from './MockTestResultsPanel';
import { useLeadMockTestResultsPage } from '../hooks/useLeadMockTestResultsPage';
import { useLeadMockTestInExamStatus } from '../hooks/useLeadMockTestInExamStatus';

type Props = {
  notice?: string | null;
};

export function LeadMockTestResultsView({ notice }: Props) {
  const { items, loading, error, authReady } = useLeadMockTestResultsPage();
  const { status: inExamStatus, loading: inExamLoading } =
    useLeadMockTestInExamStatus(authReady);
  const { siteLinks } = usePortalSiteLinks();

  const showInProgress =
    !inExamLoading && Boolean(inExamStatus?.activeInExam?.resumeAllowed);

  return (
    <>
      <PageHeader
        title="Lịch sử thi thử"
        description={
          <>
            Theo dõi buổi thi tại trung tâm và bài thi online.{' '}
            <Link href="/mock-test-online/register">Đăng ký thi online mới</Link>
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
        {notice === 'attempt_limit' ? (
          <LeadConsultCta
            siteLinks={siteLinks}
            title="Cần tư vấn thêm lộ trình học?"
            className="mt-4 rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3"
          />
        ) : null}
      </PageCard>
      <div className="mt-4">
        <Link href="/mock-test-online">
          <Button>Về trang thi thử online</Button>
        </Link>
      </div>
    </>
  );
}
