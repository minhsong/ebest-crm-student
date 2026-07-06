'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { PageCard, PageHeader } from '@/components/layout';
import { MockTestResultsPanel } from './MockTestResultsPanel';
import { useStudentMockTestResultsPage } from '../hooks/useStudentMockTestResultsPage';

export function StudentMockTestResultsView() {
  const { items, loading, error } = useStudentMockTestResultsPage();

  return (
    <>
      <PageHeader
        title="Kết quả thi thử online"
        description={
          <>
            Lịch sử thi thử từ funnel public và sau khi trở thành học viên.{' '}
            <Link href="/mock-test-online/register">Đăng ký thi mới</Link>
          </>
        }
      />
      <PageCard>
        <MockTestResultsPanel items={items} loading={loading} error={error} />
      </PageCard>
      <div className="mt-4">
        <Link href="/mock-test-online">
          <Button>Về trang thi thử online</Button>
        </Link>
      </div>
    </>
  );
}
