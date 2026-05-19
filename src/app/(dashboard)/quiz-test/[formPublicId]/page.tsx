import type { Metadata } from 'next';
import { Suspense } from 'react';

import { QuizAttemptClient } from '@/features/quiz-test';
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
  searchParams?: { assignmentId?: string; section?: string; question?: string };
}) {
  const raw = searchParams?.assignmentId;
  const assignmentId =
    typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : undefined;
  const secRaw = searchParams?.section;
  const initialSectionId =
    typeof secRaw === 'string' && /^\d+$/.test(secRaw) ? Number(secRaw) : undefined;
  const qRaw = searchParams?.question;
  const initialQuestionKey =
    typeof qRaw === 'string' && qRaw.trim() !== '' ? qRaw : undefined;
  return (
    <Suspense
      fallback={
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      }
    >
      <QuizAttemptClient
        formPublicId={params.formPublicId}
        assignmentId={assignmentId}
        initialSectionId={initialSectionId}
        initialQuestionKey={initialQuestionKey}
      />
    </Suspense>
  );
}
