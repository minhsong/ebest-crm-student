import { io, type Socket } from 'socket.io-client';

import {
  getQuizGatewaySocketIoPath,
  getQuizGatewayWsOrigin,
} from '@/features/quiz-test/quiz-gateway-browser';

export const DRILL_WS = {
  CONNECTED: 'drill:connected',
  JOIN: 'drill:join',
  JOINED: 'drill:joined',
  ANSWER: 'drill:answer',
  ANSWER_ACK: 'drill:answer:ack',
  STATE_SYNC: 'drill:state:sync',
  TIMER_SYNC: 'drill:timer:sync',
  PLAY_CLOSED: 'drill:play:closed',
  ERROR: 'drill:error',
} as const;

const NAMESPACE_PATH = '/learning-drill-runtime';

export async function fetchDrillWsAccessToken(): Promise<string | null> {
  const res = await fetch('/api/drill-ws/token', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { accessToken?: string };
  const t = j.accessToken?.trim();
  return t || null;
}

export function connectDrillRuntimeSocket(accessToken: string): Socket {
  const origin = getQuizGatewayWsOrigin();
  if (!origin) {
    throw new Error('Không kết nối được phiên luyện tập. Vui lòng tải lại trang.');
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
