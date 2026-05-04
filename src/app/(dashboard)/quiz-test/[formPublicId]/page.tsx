import type { Metadata } from 'next';

import { buildPageMetadata } from '@/lib/metadata';
import { QuizAttemptClient } from '@/features/quiz-test';

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
  searchParams?: { assignmentId?: string };
}) {
  const raw = searchParams?.assignmentId;
  const assignmentId =
    typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : undefined;
  return (
    <QuizAttemptClient
      formPublicId={params.formPublicId}
      assignmentId={assignmentId}
    />
  );
}
