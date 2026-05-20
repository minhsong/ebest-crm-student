import type { Metadata } from 'next';
import { Suspense } from 'react';

import { QuizAssignmentResultsEntryClient } from '@/features/quiz-test/components/QuizAssignmentResultsEntryClient';
import { buildPageMetadata } from '@/lib/metadata';
import { Card, Skeleton } from 'antd';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Kết quả bài làm',
    description: 'Danh sách các lần làm bài và xem chi tiết kết quả.',
    path: '/quiz-test',
  });
}

export default function QuizAssignmentResultsPage({
  params,
}: {
  params: { formPublicId: string };
}) {
  return (
    <Suspense
      fallback={
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      }
    >
      <QuizAssignmentResultsEntryClient formPublicId={params.formPublicId} />
    </Suspense>
  );
}
