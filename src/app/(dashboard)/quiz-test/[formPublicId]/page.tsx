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
}: {
  params: { formPublicId: string };
}) {
  return <QuizAttemptClient formPublicId={params.formPublicId} />;
}
