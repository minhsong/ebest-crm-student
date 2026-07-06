import { io, type Socket } from 'socket.io-client';

import {
  getQuizGatewaySocketIoPath,
  getQuizGatewayWsOrigin,
} from '@/features/quiz-test/quiz-gateway-browser';

/** Khớp `ebest-social-gateway` `mock-test-online-ws.constants`. */
export const MOCK_TEST_ONLINE_WS = {
  CONNECTED: 'mto:connected',
  UNLOCK_READY: 'mto:unlock:ready',
  STATUS: 'mto:status',
  ERROR: 'mto:error',
} as const;

const NAMESPACE_PATH = '/mock-test-online';

export type MockTestOnlineUnlockReadyEvent = {
  pendingRegistrationId: string;
  registrationId: number;
  sessionId: number;
  status: 'zalo_verified';
  examUnlockExpiresAt: string | null;
  examSessionToken?: string;
  examSessionExpiresAt?: string;
  nextStep: 'proceed_to_ready';
};

export function connectMockTestOnlineSocket(examSessionToken: string): Socket {
  const origin = getQuizGatewayWsOrigin();
  if (!origin) {
    throw new Error('Không kết nối được phiên xác minh. Vui lòng tải lại trang.');
  }
  const path = getQuizGatewaySocketIoPath();
  return io(`${origin}${NAMESPACE_PATH}`, {
    path,
    transports: ['websocket', 'polling'],
    auth: { token: examSessionToken },
    withCredentials: true,
    autoConnect: true,
  });
}

export function isMockTestOnlineWsConfigured(): boolean {
  return Boolean(getQuizGatewayWsOrigin()?.trim());
}
