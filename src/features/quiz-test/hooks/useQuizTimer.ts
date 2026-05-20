/**
 * Quiz Timer Hook
 * Handles countdown timer logic with auto-submit on timeout
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StartAttemptResponse } from '@/features/quiz-test/types';
import {
  getAttemptTimerValidity,
  REMAINING_UNSET,
  syncRemainingFromAttempt,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { message as antdMessage } from 'antd';

interface UseQuizTimerOptions {
  onAutoSubmit: () => Promise<void>;
}

interface UseQuizTimerReturn {
  remainingSeconds: number;
  isTimerValid: boolean;
  resetTimer: () => void;
}

/**
 * Hook to manage quiz countdown timer
 * - Syncs remaining time from attempt
 * - Counts down in real-time
 * - Triggers auto-submit when time runs out
 */
export function useQuizTimer(
  attempt: StartAttemptResponse | null,
  phase: string,
  options: UseQuizTimerOptions,
): UseQuizTimerReturn {
  const { onAutoSubmit } = options;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(REMAINING_UNSET);
  const autoSubmitTriggeredRef = useRef(false);

  // Reset auto-submit flag when attempt changes
  useEffect(() => {
    autoSubmitTriggeredRef.current = false;
    if (attempt) {
      setRemainingSeconds(syncRemainingFromAttempt(attempt));
    } else {
      setRemainingSeconds(REMAINING_UNSET);
    }
  }, [attempt]);

  // Countdown effect
  useEffect(() => {
    if (phase !== 'attempting' || !attempt) return;

    const timerValidity = getAttemptTimerValidity(attempt);
    if (!timerValidity.ok) {
      setRemainingSeconds(REMAINING_UNSET);
      return;
    }

    // Calculate initial tick
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((timerValidity.deadlineMs - Date.now()) / 1000));
      return remaining;
    };

    setRemainingSeconds(tick());

    // Start interval
    const intervalId = setInterval(() => {
      const remaining = tick();
      setRemainingSeconds(remaining);
      if (remaining <= 0) clearInterval(intervalId);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [attempt, phase]);

  // Auto-submit effect
  useEffect(() => {
    if (phase !== 'attempting' || !attempt) return;
    if (!getAttemptTimerValidity(attempt).ok) return;
    if (!Number.isFinite(remainingSeconds) || remainingSeconds === REMAINING_UNSET) return;
    if (remainingSeconds > 0 || autoSubmitTriggeredRef.current) return;

    autoSubmitTriggeredRef.current = true;
    setErrMsg('Hết giờ làm bài. Hệ thống đang tự động nộp bài.');
    antdMessage.warning('Đã hết giờ, hệ thống tự động nộp bài.');
    void onAutoSubmit();
  }, [attempt, onAutoSubmit, phase, remainingSeconds]);

  const setErrMsg = useCallback((msg: string) => {
    // This is a placeholder - actual error handling is done in the main hook
    console.warn(msg);
  }, []);

  const resetTimer = useCallback(() => {
    autoSubmitTriggeredRef.current = false;
    if (attempt) {
      setRemainingSeconds(syncRemainingFromAttempt(attempt));
    }
  }, [attempt]);

  return {
    remainingSeconds,
    isTimerValid: getAttemptTimerValidity(attempt).ok,
    resetTimer,
  };
}
