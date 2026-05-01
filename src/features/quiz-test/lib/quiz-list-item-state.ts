import { toViDateTime } from '@/features/quiz-test/lib/quiz-runtime-view';
import type { QuizAttemptProgressItem } from '@/features/quiz-test/types';

export type QuizListItemUiState = {
  actionLabel: string;
  buttonType: 'primary' | 'default';
  statusLine: string;
};

export function buildQuizListItemUiState(
  progress: QuizAttemptProgressItem | undefined,
): QuizListItemUiState {
  if (!progress) {
    return {
      actionLabel: 'Bắt đầu làm',
      buttonType: 'primary',
      statusLine: '',
    };
  }
  if (progress.status === 'in_progress') {
    const alive = progress.remainingSeconds > 0;
    return {
      actionLabel: alive ? 'Tiếp tục làm' : 'Vào đề',
      buttonType: alive ? 'primary' : 'default',
      statusLine: alive
        ? `Đang làm · còn khoảng ${Math.max(1, Math.ceil(progress.remainingSeconds / 60))} phút`
        : 'Phiên trước đã đóng (hết giờ hoặc đã khóa) — bạn có thể vào đề làm lại.',
    };
  }
  if (progress.status === 'submitted') {
    const t =
      progress.submittedAt != null &&
      typeof progress.submittedAt === 'string' &&
      progress.submittedAt
        ? toViDateTime(progress.submittedAt)
        : '';
    return {
      actionLabel: 'Vào đề',
      buttonType: 'default',
      statusLine: t
        ? `Đã nộp lần gần nhất · ${t}`
        : 'Đã nộp bài gần đây — vào đề để làm tiếp hoặc xem lịch sử.',
    };
  }
  if (progress.status === 'expired') {
    return {
      actionLabel: 'Vào đề',
      buttonType: 'default',
      statusLine: 'Lần trước hết giờ trước khi nộp.',
    };
  }
  return {
    actionLabel: 'Vào đề',
    buttonType: 'default',
    statusLine: '',
  };
}
