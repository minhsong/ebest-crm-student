/**
 * Quiz WebSocket Hook
 * Handles real-time socket.io connection for answer sync
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { message as antdMessage } from 'antd';
import {
  QUIZ_WS,
  connectQuizRuntimeSocket,
  fetchQuizWsAccessToken,
  normalizeAnswersWsPayload,
} from '@/features/quiz-test/quiz-runtime-ws-client';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';

interface UseQuizWebSocketOptions {
  attemptPublicId: string | undefined;
  enabled: boolean;
  onAnswersSync: (answers: Record<string, string | string[]>) => void;
  onListeningSync: (remaining: Record<string, number>) => void;
}

interface UseQuizWebSocketReturn {
  isConnected: boolean;
  forceReconnect: () => void;
}

/**
 * Hook to manage WebSocket connection for real-time answer synchronization
 */
export function useQuizWebSocket(
  options: UseQuizWebSocketOptions,
): UseQuizWebSocketReturn {
  const { attemptPublicId, enabled, onAnswersSync, onListeningSync } = options;
  const socketRef = useRef<Socket | null>(null);
  const cancelledRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    cancelledRef.current = true;
    const s = socketRef.current;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
    socketRef.current = null;
  }, []);

  // Connect effect
  useEffect(() => {
    if (!enabled || !attemptPublicId) {
      cleanup();
      return;
    }

    cancelledRef.current = false;
    let localSocket: Socket | null = null;

    const connect = async () => {
      const token = await fetchQuizWsAccessToken();
      if (cancelledRef.current || !token) return;

      try {
        const sock = connectQuizRuntimeSocket(token);
        localSocket = sock;
        socketRef.current = sock;

        sock.on('connect_error', () => {
          // Silently handle connection errors - REST fallback will work
        });

        // Handle answer sync from server
        sock.on(QUIZ_WS.ANSWERS_SYNC, (payload: unknown) => {
          const p = payload as {
            attemptPublicId?: string;
            answersByFormItemId?: Record<string, unknown>;
          };
          if (p?.attemptPublicId !== attemptPublicId) return;
          onAnswersSync(normalizeAnswersWsPayload(p.answersByFormItemId));
        });

        // Handle listening state sync
        sock.on(QUIZ_WS.LISTENING_STATE_SYNC, (payload: unknown) => {
          const p = payload as {
            attemptPublicId?: string;
            remainingPlaysByListeningUnit?: unknown;
          };
          if (p?.attemptPublicId !== attemptPublicId) return;
          onListeningSync(normalizeListeningMap(p.remainingPlaysByListeningUnit));
        });

        // Join attempt room and request snapshot
        const sendJoin = () => {
          sock.emit(QUIZ_WS.JOIN, { attemptPublicId }, (ack: unknown) => {
            const a = ack as {
              event?: string;
              data?: { snapshot?: { answersByFormItemId?: Record<string, unknown> } };
            };
            const raw = a?.data?.snapshot?.answersByFormItemId;
            if (a?.event === QUIZ_WS.JOINED && raw && typeof raw === 'object' && !Array.isArray(raw)) {
              onAnswersSync(normalizeAnswersWsPayload(raw as Record<string, unknown>));
            }
          });
        };

        if (sock.connected) {
          sendJoin();
        }
        sock.on('connect', sendJoin);
      } catch {
        /* REST autosave fallback will handle this */
      }
    };

    void connect();

    return cleanup;
  }, [attemptPublicId, enabled, onAnswersSync, onListeningSync, cleanup]);

  const forceReconnect = useCallback(() => {
    cleanup();
    if (attemptPublicId) {
      cancelledRef.current = false;
      void fetchQuizWsAccessToken().then((token) => {
        if (token) {
          const sock = connectQuizRuntimeSocket(token);
          socketRef.current = sock;
        }
      });
    }
  }, [attemptPublicId, cleanup]);

  return {
    isConnected: socketRef.current?.connected ?? false,
    forceReconnect,
  };
}

/**
 * Normalize listening map from server response
 */
function normalizeListeningMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n)) o[String(k)] = n;
  }
  return o;
}
