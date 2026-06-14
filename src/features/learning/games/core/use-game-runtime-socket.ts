import { useCallback, useEffect, useRef, useState } from 'react';

import type { Socket } from 'socket.io-client';



export type GameRuntimeWsEvents = {

  JOIN: string;

  JOINED: string;

  TIMER_SYNC: string;

  STATE_SYNC?: string;

  PLAY_CLOSED?: string;

};



export type GameRuntimeStateSyncPayload = {

  playId?: string;

  completed?: boolean;

  correct?: boolean;

  scoreInRun?: number;

  status?: string;

};



type Options = {

  playId: string | null;

  enabled: boolean;

  events: GameRuntimeWsEvents;

  fetchAccessToken: () => Promise<string | null>;

  connectSocket: (accessToken: string) => Socket;

  onTimerSecondsLeft?: (secondsLeft: number) => void;

  onStateSync?: (payload: GameRuntimeStateSyncPayload) => void;

  onPlayClosed?: (payload: GameRuntimeStateSyncPayload) => void;

};



/**

 * Generic game runtime WS — join room + authoritative timer sync (GE-V4).

 * Family hooks (vocabulary drill) supply transport + event names.

 */

export function useGameRuntimeSocket({

  playId,

  enabled,

  events,

  fetchAccessToken,

  connectSocket,

  onTimerSecondsLeft,

  onStateSync,

  onPlayClosed,

}: Options) {

  const socketRef = useRef<Socket | null>(null);

  const readyRef = useRef(false);

  const [connected, setConnected] = useState(false);



  const onStateSyncRef = useRef(onStateSync);

  const onPlayClosedRef = useRef(onPlayClosed);

  onStateSyncRef.current = onStateSync;

  onPlayClosedRef.current = onPlayClosed;



  useEffect(() => {

    if (!enabled || !playId) {

      socketRef.current?.removeAllListeners();

      socketRef.current?.disconnect();

      socketRef.current = null;

      readyRef.current = false;

      setConnected(false);

      return;

    }



    let cancelled = false;

    const activePlayId = playId;



    const connect = async () => {

      const token = await fetchAccessToken();

      if (cancelled || !token) return;



      try {

        const sock = connectSocket(token);

        socketRef.current = sock;

        readyRef.current = false;

        setConnected(false);



        sock.on('connect', () => {

          sock.emit(events.JOIN, { playId: activePlayId });

        });

        sock.on(events.JOINED, () => {

          readyRef.current = true;

          setConnected(true);

        });

        sock.on(events.TIMER_SYNC, (payload: unknown) => {

          const p = payload as { playId?: string; secondsLeft?: number };

          if (p?.playId !== activePlayId) return;

          if (typeof p.secondsLeft === 'number') {

            onTimerSecondsLeft?.(p.secondsLeft);

          }

        });

        if (events.STATE_SYNC) {

          sock.on(events.STATE_SYNC, (payload: unknown) => {

            const p = payload as GameRuntimeStateSyncPayload;

            if (p?.playId !== activePlayId) return;

            onStateSyncRef.current?.(p);

          });

        }

        if (events.PLAY_CLOSED) {

          sock.on(events.PLAY_CLOSED, (payload: unknown) => {

            const p = payload as GameRuntimeStateSyncPayload;

            if (p?.playId !== activePlayId) return;

            onPlayClosedRef.current?.(p);

          });

        }

        sock.on('connect_error', () => {

          readyRef.current = false;

          setConnected(false);

        });

      } catch {

        readyRef.current = false;

        setConnected(false);

      }

    };



    void connect();



    return () => {

      cancelled = true;

      socketRef.current?.removeAllListeners();

      socketRef.current?.disconnect();

      socketRef.current = null;

      readyRef.current = false;

      setConnected(false);

    };

  }, [

    connectSocket,

    enabled,

    events.JOIN,

    events.JOINED,

    events.TIMER_SYNC,

    events.STATE_SYNC,

    events.PLAY_CLOSED,

    fetchAccessToken,

    onTimerSecondsLeft,

    playId,

  ]);



  return {

    socket: socketRef,

    wsReady: readyRef,

    connected,

  };

}



export type { GameRuntimeStateSyncPayload as GameRuntimeWsStatePayload };


