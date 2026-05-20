import { redirect } from 'next/navigation';

/** Catalog quiz công khai đã bỏ — chuyển sang Ôn luyện / Bài tập. */
export default function QuizTestListRedirectPage() {
  redirect('/practice-quizzes');
}
