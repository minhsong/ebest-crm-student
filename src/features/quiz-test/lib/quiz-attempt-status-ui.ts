import type { QuizAttemptAnswerProgress } from '@/features/quiz-test/lib/quiz-attempt-progress.util';

/** Helpers hiển thị cụm timer / tiến độ / lượt nghe trên sticky bar. */

export function isFiniteDisplayNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isListeningAutoStartCountdownActive(
  seconds: number | null | undefined,
): boolean {
  return isFiniteDisplayNumber(seconds) && seconds > 0;
}

export function isListeningCountdownActive(
  seconds: number | null | undefined,
): boolean {
  return isListeningAutoStartCountdownActive(seconds);
}

export function shouldShowListeningRemainingPlays(
  plays: number | null | undefined,
): boolean {
  return isFiniteDisplayNumber(plays);
}

export function shouldShowQuestionProgress(
  progress: QuizAttemptAnswerProgress | null | undefined,
): progress is QuizAttemptAnswerProgress {
  return (
    !!progress &&
    isFiniteDisplayNumber(progress.totalCount) &&
    progress.totalCount > 0
  );
}

export type QuizAttemptStatusClusterVisibility = {
  showTimer?: boolean;
  questionProgress?: QuizAttemptAnswerProgress | null;
  listeningRemainingPlays?: number | null;
  listeningAutoStartCountdown?: number | null;
  listeningInterRoundCountdown?: number | null;
};

export function isQuizAttemptStatusClusterVisible(
  props: QuizAttemptStatusClusterVisibility,
): boolean {
  return (
    Boolean(props.showTimer) ||
    shouldShowQuestionProgress(props.questionProgress) ||
    shouldShowListeningRemainingPlays(props.listeningRemainingPlays) ||
    isListeningCountdownActive(props.listeningAutoStartCountdown) ||
    isListeningCountdownActive(props.listeningInterRoundCountdown)
  );
}
