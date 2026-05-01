import { buildPageMetadata } from '@/lib/metadata';
import { QuizTestListClient } from '@/features/quiz-test';

export const metadata = buildPageMetadata({
  title: 'Quiz test',
  description: 'Danh sách đề làm kiểm tra / ôn tập.',
  path: '/quiz-test',
});

export default function QuizTestPage() {
  return <QuizTestListClient />;
}
