import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import type { QuizPublishedFormPayload } from '@/features/quiz-test/types';

const DEFAULT_FORM_NAME = 'Bài trắc nghiệm';

export async function fetchQuizFormDisplayName(
  formPublicId: string,
): Promise<string> {
  const res = await fetchQuizRuntimeJson<QuizPublishedFormPayload>(
    quizRuntimePublicUrl(`forms/${formPublicId}`),
  );
  const name = res.ok && res.data?.name ? String(res.data.name).trim() : '';
  return name || DEFAULT_FORM_NAME;
}
