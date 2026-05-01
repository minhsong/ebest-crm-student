import type { Metadata } from 'next';

import { QuizAttemptResultClient } from '@/features/quiz-test';
import { buildPageMetadata } from '@/lib/metadata';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Kết quả bài làm',
    description: 'Chi tiết kết quả một lần làm bài quiz test.',
    path: '/quiz-test',
  });
}

export default function QuizAttemptResultPage({
  params,
}: {
  params: { formPublicId: string; attemptPublicId: string };
}) {
  return (
    <QuizAttemptResultClient
      formPublicId={params.formPublicId}
      attemptPublicId={params.attemptPublicId}
    />
  );
}
