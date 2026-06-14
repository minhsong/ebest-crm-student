import type { Socket } from 'socket.io-client';

type SubmitViaWsOptions<T> = {
  socket: Socket | null;
  wsReady: boolean;
  events: {
    ANSWER: string;
    ANSWER_ACK: string;
    ERROR: string;
  };
  payload: Record<string, unknown>;
  httpSubmit: () => Promise<T>;
  timeoutMs?: number;
};

/** WS primary + HTTP fallback — shared by game family hooks (GE-V4). */
export async function submitGameAnswerViaWsOrHttp<T>(
  options: SubmitViaWsOptions<T>,
): Promise<T> {
  const { socket, wsReady, events, payload, httpSubmit, timeoutMs = 8000 } = options;

  if (wsReady && socket?.connected) {
    try {
      return await new Promise<T>((resolve, reject) => {
        if (!socket) {
          reject(new Error('WS unavailable'));
          return;
        }
        const timer = window.setTimeout(() => {
          socket.off(events.ANSWER_ACK, onAck);
          socket.off(events.ERROR, onErr);
          reject(new Error('WS timeout'));
        }, timeoutMs);
        const onAck = (ackPayload: unknown) => {
          window.clearTimeout(timer);
          socket.off(events.ANSWER_ACK, onAck);
          socket.off(events.ERROR, onErr);
          resolve(ackPayload as T);
        };
        const onErr = () => {
          window.clearTimeout(timer);
          socket.off(events.ANSWER_ACK, onAck);
          socket.off(events.ERROR, onErr);
          reject(new Error('WS answer failed'));
        };
        socket.on(events.ANSWER_ACK, onAck);
        socket.on(events.ERROR, onErr);
        socket.emit(events.ANSWER, payload);
      });
    } catch {
      return httpSubmit();
    }
  }

  return httpSubmit();
}
