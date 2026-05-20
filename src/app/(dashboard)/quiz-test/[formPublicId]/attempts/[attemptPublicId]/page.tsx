import type { Metadata } from 'next';
import { Suspense } from 'react';

import { QuizAttemptResultClient } from '@/features/quiz-test';
import { buildPageMetadata } from '@/lib/metadata';
import { Card, Skeleton } from 'antd';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Kết quả bài làm',
    description: 'Chi tiết kết quả một lần làm bài quiz test.',
    path: '/quiz-test',
  });
}

export default function QuizAttemptResultPage({
  params,
  searchParams,
}: {
  params: { formPublicId: string; attemptPublicId: string };
  searchParams?: { question?: string; assignmentId?: string };
}) {
  const qRaw = searchParams?.question;
  const initialQuestionKey =
    typeof qRaw === 'string' && qRaw.trim() !== '' ? qRaw : undefined;

  // Parse assignmentId từ query param
  const assignmentIdRaw = searchParams?.assignmentId;
  const assignmentId =
    typeof assignmentIdRaw === 'string' && assignmentIdRaw.trim() !== ''
      ? parseInt(assignmentIdRaw, 10)
      : undefined;
  const parsedAssignmentId = !isNaN(assignmentId!) ? assignmentId : undefined;

  return (
    <Suspense
      fallback={
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      }
    >
      <QuizAttemptResultClient
        formPublicId={params.formPublicId}
        attemptPublicId={params.attemptPublicId}
        initialQuestionKey={initialQuestionKey}
        assignmentId={parsedAssignmentId}
      />
    </Suspense>
  );
}
