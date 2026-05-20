import type { Metadata } from 'next';
import { Suspense } from 'react';

import { QuizAttemptEntryClient } from '@/features/quiz-test/components/QuizAttemptEntryClient';
import { buildPageMetadata } from '@/lib/metadata';
import { Card, Skeleton } from 'antd';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Làm bài',
    description: 'Màn làm bài — Quiz Runtime trên Social Gateway.',
    path: '/quiz-test',
  });
}

export default function QuizTestAttemptPage({
  params,
  searchParams,
}: {
  params: { formPublicId: string };
  searchParams?: {
    section?: string;
    question?: string;
    /** Legacy — không dùng; giữ để link cũ không 404 */
    assignmentId?: string;
    mode?: string;
  };
}) {
  const secRaw = searchParams?.section;
  const initialSectionId =
    typeof secRaw === 'string' && /^\d+$/.test(secRaw) ? Number(secRaw) : undefined;
  const qRaw = searchParams?.question;
  const initialQuestionKey =
    typeof qRaw === 'string' && qRaw.trim() !== '' ? qRaw : undefined;

  const preferPractice = searchParams?.mode === 'practice';

  return (
    <Suspense
      fallback={
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      }
    >
      <QuizAttemptEntryClient
        formPublicId={params.formPublicId}
        preferPractice={preferPractice}
        initialSectionId={initialSectionId}
        initialQuestionKey={initialQuestionKey}
      />
    </Suspense>
  );
}
