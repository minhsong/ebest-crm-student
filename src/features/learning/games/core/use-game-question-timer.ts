import { useEffect, useRef, useState } from 'react';
import { playTimerTickSound } from '@/features/learning/utils/game-sfx';

type Options = {
  questionId: string | null;
  enabled: boolean;
  paused: boolean;
  seconds: number;
  onTimeout: () => void;
  serverSecondsLeft?: number | null;
};

/** Countdown câu hỏi — dùng chung mọi game MCQ/timed (GE-V4). */
export function useGameQuestionTimer({
  questionId,
  enabled,
  paused,
  seconds,
  onTimeout,
  serverSecondsLeft,
}: Options) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const onTimeoutRef = useRef(onTimeout);
  const firedForQuestionRef = useRef<string | null>(null);
  const prevSecondsLeftRef = useRef<number | null>(null);
  const ignoreServerSyncUntilRef = useRef(0);
  /** Chặn false timeout khi đổi câu — secondsLeft stale = 0 trước khi reset effect flush. */
  const suppressTimeoutUntilReadyRef = useRef(false);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    suppressTimeoutUntilReadyRef.current = true;
    ignoreServerSyncUntilRef.current = Date.now() + 400;
    setSecondsLeft(seconds);
    firedForQuestionRef.current = null;
    prevSecondsLeftRef.current = null;
  }, [questionId, seconds]);

  useEffect(() => {
    if (suppressTimeoutUntilReadyRef.current && secondsLeft > 0) {
      suppressTimeoutUntilReadyRef.current = false;
    }
  }, [secondsLeft, questionId]);

  useEffect(() => {
    if (serverSecondsLeft == null) return;
    if (Date.now() < ignoreServerSyncUntilRef.current) return;
    setSecondsLeft(serverSecondsLeft);
  }, [serverSecondsLeft, questionId]);

  useEffect(() => {
    if (!enabled || paused || !questionId) {
      prevSecondsLeftRef.current = null;
      return;
    }

    if (prevSecondsLeftRef.current === null) {
      prevSecondsLeftRef.current = secondsLeft;
      return;
    }

    if (secondsLeft < prevSecondsLeftRef.current) {
      playTimerTickSound(secondsLeft);
    }
    prevSecondsLeftRef.current = secondsLeft;
  }, [enabled, paused, questionId, secondsLeft]);

  useEffect(() => {
    if (!enabled || paused || !questionId) return;
    if (suppressTimeoutUntilReadyRef.current) return;

    if (secondsLeft <= 0) {
      if (firedForQuestionRef.current === questionId) return;
      firedForQuestionRef.current = questionId;
      onTimeoutRef.current();
      return;
    }

    const id = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [enabled, paused, questionId, secondsLeft]);

  return { secondsLeft, totalSeconds: seconds };
}
