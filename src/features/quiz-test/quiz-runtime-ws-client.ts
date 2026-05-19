import { io, type Socket } from 'socket.io-client';

import {
  getQuizGatewaySocketIoPath,
  getQuizGatewayWsOrigin,
} from '@/features/quiz-test/quiz-gateway-browser';

/** Khớp `ebest-social-gateway` `quiz-runtime-ws.constants`. */
export const QUIZ_WS = {
  CONNECTED: 'quiz:connected',
  JOIN: 'quiz:join',
  JOINED: 'quiz:joined',
  PATCH_ANSWERS: 'quiz:patchAnswers',
  ANSWERS_ACK: 'quiz:answers:ack',
  ANSWERS_SYNC: 'quiz:answers:sync',
  LISTENING_CYCLE_DONE: 'quiz:listening:cycleDone',
  LISTENING_CYCLE_ACK: 'quiz:listening:cycleAck',
  LISTENING_STATE_SYNC: 'quiz:listening:stateSync',
  ERROR: 'quiz:error',
} as const;

const NAMESPACE_PATH = '/quiz-runtime';

export async function fetchQuizWsAccessToken(): Promise<string | null> {
  const res = await fetch('/api/quiz-ws/token', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { accessToken?: string };
  const t = j.accessToken?.trim();
  return t || null;
}

export function connectQuizRuntimeSocket(accessToken: string): Socket {
  const origin = getQuizGatewayWsOrigin();
  if (!origin) {
    throw new Error(
      'Thiếu NEXT_PUBLIC_SOCIAL_GATEWAY_WS_ORIGIN (ví dụ http://127.0.0.1:3040).',
    );
  }
  const path = getQuizGatewaySocketIoPath();
  return io(`${origin}${NAMESPACE_PATH}`, {
    path,
    transports: ['websocket', 'polling'],
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
  });
}

export function normalizeAnswersWsPayload(
  raw: Record<string, unknown> | null | undefined,
): Record<string, string | string[]> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) out[k] = v.map(String);
    else if (v != null && String(v) !== '') out[k] = String(v);
  }
  return out;
}
