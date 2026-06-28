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
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    setSecondsLeft(seconds);
    firedForQuestionRef.current = null;
    prevSecondsLeftRef.current = null;
  }, [questionId, seconds]);

  useEffect(() => {
    if (serverSecondsLeft == null) return;
    setSecondsLeft(serverSecondsLeft);
    if (serverSecondsLeft <= 0) {
      firedForQuestionRef.current = null;
    }
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
