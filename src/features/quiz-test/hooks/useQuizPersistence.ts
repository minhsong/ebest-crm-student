/**
 * Quiz Persistence Hook
 * Handles answer auto-save via WebSocket and REST fallback
 */

import { useCallback } from 'react';
import { message as antdMessage } from 'antd';
import { QUIZ_WS } from '@/features/quiz-test/quiz-runtime-ws-client';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';

interface UseQuizPersistenceOptions {
  socket: { connected: boolean; emit: (event: string, data: unknown, callback?: (ack: unknown) => void) => void } | null;
  attemptPublicId: string;
}

interface UseQuizPersistenceReturn {
  persistAnswers: (answers: Record<string, string | string[]>) => void;
  patchAnswersImmediately: (map: Record<string, string | string[]>) => Promise<boolean>;
}

/**
 * Hook to handle answer persistence (WebSocket primary, REST fallback)
 */
export function useQuizPersistence(
  socket: Socket | null,
  attemptPublicId: string,
): UseQuizPersistenceReturn {
  const persistAnswers = useCallback(
    (answers: Record<string, string | string[]>) => {
      const sock = socket;
      if (sock?.connected) {
        sock.emit(
          QUIZ_WS.PATCH_ANSWERS,
          { attemptPublicId, answersByFormItemId: answers },
          (ack: unknown) => {
            const a = ack as { event?: string };
            if (a?.event === QUIZ_WS.ERROR) {
              // Fallback to REST
              const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
              void fetch(url, {
                credentials: 'include',
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body: JSON.stringify({ answersByFormItemId: answers }),
              }).catch(() => undefined);
            }
          },
        );
        return;
      }
      // No socket, use REST directly
      const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
      void fetch(url, {
        credentials: 'include',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ answersByFormItemId: answers }),
      }).catch(() => undefined);
    },
    [socket, attemptPublicId],
  );

  const patchAnswersImmediately = useCallback(
    async (map: Record<string, string | string[]>): Promise<boolean> => {
      const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
      const { ok } = await fetchQuizRuntimeJson(url, {
        method: 'PATCH',
        body: JSON.stringify({ answersByFormItemId: map }),
      });
      if (!ok) {
        antdMessage.warning(
          'Không lưu nháp được — kiểm tra mạng hoặc phiên làm bài đã hết hạn.',
        );
      }
      return ok;
    },
    [attemptPublicId],
  );

  return {
    persistAnswers,
    patchAnswersImmediately,
  };
}

// Type for socket (simplified)
type Socket = {
  connected: boolean;
  emit: (event: string, data: unknown, callback?: (ack: unknown) => void) => void;
};
