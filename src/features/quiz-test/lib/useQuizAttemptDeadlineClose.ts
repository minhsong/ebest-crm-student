'use client';

import { useCallback, useRef } from 'react';
import { message as antdMessage } from 'antd';
import type { SubmitAttemptResponse } from '@/features/quiz-test/types';
import {
  DEADLINE_REST_SUBMIT_FALLBACK_MS,
  parseAttemptClosedWsPayload,
  pollAttemptUntilTerminal,
  submitResponseFromAttemptSnapshot,
} from '@/features/quiz-test/lib/quiz-attempt-deadline-close';
import {
  QUIZ_ATTEMPT_DEADLINE_USER_MESSAGE,
  QUIZ_ATTEMPT_DEADLINE_WAIT_MESSAGE,
  type QuizAttemptCloseReason,
} from '@/features/quiz-test/lib/quiz-attempt-session-lock';

export type UseQuizAttemptDeadlineCloseArgs = {
  finalizeSubmitted: (
    submitted: SubmitAttemptResponse,
    userMessage: string | null,
    closeReason: QuizAttemptCloseReason,
  ) => Promise<void>;
  requestSubmitFallback: () => Promise<void>;
};

/**
 * Hết giờ: khóa UI → chờ WS/poll server → finalize → redirect (ở parent).
 */
export function useQuizAttemptDeadlineClose({
  finalizeSubmitted,
  requestSubmitFallback,
}: UseQuizAttemptDeadlineCloseArgs) {
  const deadlineFlowStartedRef = useRef(false);
  const serverClosedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current != null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const markServerClosed = useCallback(() => {
    serverClosedRef.current = true;
    clearFallbackTimer();
  }, [clearFallbackTimer]);

  const handleServerAttemptClosed = useCallback(
    async (payload: unknown, attemptId: string) => {
      if (serverClosedRef.current) return true;
      const parsed = parseAttemptClosedWsPayload(payload, attemptId);
      if (!parsed) return false;

      markServerClosed();
      const closeReason: QuizAttemptCloseReason =
        parsed.reason === 'deadline_auto_submit' ? 'deadline' : 'manual';

      await finalizeSubmitted(
        parsed.submitted,
        parsed.message ?? QUIZ_ATTEMPT_DEADLINE_USER_MESSAGE,
        closeReason,
      );
      return true;
    },
    [finalizeSubmitted, markServerClosed],
  );

  const runDeadlineCloseFlow = useCallback(
    async (attemptId: string) => {
      if (deadlineFlowStartedRef.current) return;
      deadlineFlowStartedRef.current = true;
      serverClosedRef.current = false;

      antdMessage.warning('Đã hết giờ, hệ thống tự động nộp bài.');

      const terminal = await pollAttemptUntilTerminal(attemptId);
      if (terminal && !serverClosedRef.current) {
        markServerClosed();
        const submitted = submitResponseFromAttemptSnapshot(terminal.snapshot);
        if (submitted) {
          await finalizeSubmitted(
            submitted,
            QUIZ_ATTEMPT_DEADLINE_USER_MESSAGE,
            'deadline',
          );
          return;
        }
      }

      if (!serverClosedRef.current) {
        clearFallbackTimer();
        fallbackTimerRef.current = setTimeout(() => {
          if (serverClosedRef.current) return;
          void requestSubmitFallback();
        }, DEADLINE_REST_SUBMIT_FALLBACK_MS);
      }
    },
    [
      clearFallbackTimer,
      finalizeSubmitted,
      markServerClosed,
      requestSubmitFallback,
    ],
  );

  const resetDeadlineCloseState = useCallback(() => {
    deadlineFlowStartedRef.current = false;
    serverClosedRef.current = false;
    clearFallbackTimer();
  }, [clearFallbackTimer]);

  return {
    handleServerAttemptClosed,
    runDeadlineCloseFlow,
    resetDeadlineCloseState,
    markServerClosed,
    isDeadlineFlowStarted: () => deadlineFlowStartedRef.current,
    deadlineWaitMessage: QUIZ_ATTEMPT_DEADLINE_WAIT_MESSAGE,
  };
}
