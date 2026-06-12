/** Helpers hiển thị cụm timer / lượt nghe trên sticky bar. */

export function isFiniteDisplayNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isListeningAutoStartCountdownActive(
  seconds: number | null | undefined,
): boolean {
  return isFiniteDisplayNumber(seconds) && seconds > 0;
}

export function shouldShowListeningRemainingPlays(
  plays: number | null | undefined,
): boolean {
  return isFiniteDisplayNumber(plays);
}

export type QuizAttemptStatusClusterVisibility = {
  showTimer?: boolean;
  listeningRemainingPlays?: number | null;
  listeningAutoStartCountdown?: number | null;
};

export function isQuizAttemptStatusClusterVisible(
  props: QuizAttemptStatusClusterVisibility,
): boolean {
  return (
    Boolean(props.showTimer) ||
    shouldShowListeningRemainingPlays(props.listeningRemainingPlays) ||
    isListeningAutoStartCountdownActive(props.listeningAutoStartCountdown)
  );
}
