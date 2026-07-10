import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

import { submitGameAnswerViaWsOrHttp } from '@/features/learning/games/core/submit-game-answer';
import {
  resumeGameSession,
  type GameSessionResumeContext,
} from '@/features/learning/games/core/resume-game-session';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';
import type { GameSessionState } from '@/features/learning/games/core/types/game-session.types';
import {
  useGameRuntimeSocket,
  type GameRuntimeWsEvents,
  type GameRuntimeStateSyncPayload,
} from '@/features/learning/games/core/use-game-runtime-socket';
import { useGameQuestionTimer } from '@/features/learning/games/core/use-game-question-timer';
import { primeGameAudio } from '@/features/learning/utils/game-sfx';

export type { GameAnswerFeedback, GameSessionState };
export type { GameSessionResumeContext };

type SubmitOptions = {
  selectedOptionId?: string;
  timedOut?: boolean;
};

export type GameSessionAnswerResultContext<
  TSession extends GameSessionState<TQuestion>,
  TQuestion,
  TAnswerResult extends { scoreInRun: number; correct: boolean },
> = {
  result: TAnswerResult;
  session: TSession;
  question: TQuestion;
  setQuestion: (q: TQuestion | null) => void;
  setScoreInRun: (n: number) => void;
  setStreak: (updater: (s: number) => number) => void;
  setLastCorrect: (v: boolean | null) => void;
  setFeedback: (v: GameAnswerFeedback) => void;
  setSelectedOptionId: (v: string | null) => void;
  setSubmitting: (v: boolean) => void;
  finishRun: (lastCorrect: boolean | null) => void;
  clearFeedbackTimer: () => void;
  scheduleFeedback: (delayMs: number, fn: () => void) => void;
};

type WsAnswerEvents = {
  ANSWER: string;
  ANSWER_ACK: string;
  ERROR: string;
  STATE_SYNC?: string;
  PLAY_CLOSED?: string;
};

type StartResult<TSession extends GameSessionState<TQuestion>, TQuestion> = {
  playId: string;
  session: TSession;
  question: TQuestion;
  scoreInRun: number;
  streak: number;
};

type ResumePayload<TQuestion> = {
  playId: string;
  classId: number;
  assignmentId: number | null;
  modeId: string;
  promptType: string;
  scoreInRun: number;
  streak: number;
  status: string;
  sessionConfig?: GameSessionConfig | null;
  question?: TQuestion;
  progress?: GameSessionResumeContext['progress'];
  lastAnswerCorrect?: boolean | null;
  runPassed?: boolean | null;
  gradebookSyncFailed?: boolean;
};

type Options<
  TSession extends GameSessionState<TQuestion>,
  TQuestion,
  TAnswerResult extends { scoreInRun: number; correct: boolean },
> = {
  playIdFromUrl: string | null;
  /** Payload từ GameSlugRouteShell reconcile — bỏ qua GET plays/:id lần 2. */
  prefetchedPlayPayload?: ResumePayload<TQuestion> | null;
  onPlayIdChange: (playId: string | null) => void;
  answerTimeoutSec: number;
  wsEvents: GameRuntimeWsEvents & WsAnswerEvents;
  fetchWsAccessToken: () => Promise<string | null>;
  connectSocket: (accessToken: string) => Socket;
  startSession: () => Promise<StartResult<TSession, TQuestion>>;
  fetchSession: (playId: string) => Promise<ResumePayload<TQuestion>>;
  toSessionFromStart: (started: StartResult<TSession, TQuestion>) => TSession;
  toSessionFromResume: (resumed: ResumePayload<TQuestion>) => TSession;
  submitAnswerHttp: (
    playId: string,
    questionId: string,
    options: SubmitOptions,
  ) => Promise<TAnswerResult>;
  getQuestionId: (question: TQuestion) => string;
  /** Timer anchor — speed_run dùng playId để không reset mỗi câu. */
  getTimerAnchorId?: (
    session: TSession | null,
    question: TQuestion | null,
  ) => string | null;
  onAnswerResult: (
    args: GameSessionAnswerResultContext<TSession, TQuestion, TAnswerResult>,
  ) => void;
  onSessionStarted?: (started: StartResult<TSession, TQuestion>) => void;
  onRunFinished?: (playId: string) => void;
  abandonSessionHttp?: (playId: string) => Promise<{ completed: boolean; scoreInRun: number }>;
  onSessionResumed?: (
    session: TSession,
    question: TQuestion,
    ctx: GameSessionResumeContext,
  ) => void;
  onSessionCompletedFromResume?: (
    session: TSession,
    ctx: GameSessionResumeContext,
  ) => void;
  onStartError?: (message: string) => void;
  onResumeError?: (message: string) => void;
  onSubmitError?: (message: string) => void;
  resetSessionExtras?: () => void;
};

/**
 * Generic game session hook — WS, timer, submit fallback, resume (GE-V4).
 * Family hooks supply API adapters + answer UX policy.
 */
export function useGameSession<
  TSession extends GameSessionState<TQuestion>,
  TQuestion,
  TAnswerResult extends { scoreInRun: number; correct: boolean },
>(options: Options<TSession, TQuestion, TAnswerResult>) {
  const [session, setSession] = useState<TSession | null>(null);
  const [question, setQuestion] = useState<TQuestion | null>(null);
  const [scoreInRun, setScoreInRun] = useState(0);
  const [streak, setStreak] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [finished, setFinished] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<GameAnswerFeedback>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [serverTimerSecondsLeft, setServerTimerSecondsLeft] = useState<number | null>(null);

  const feedbackTimerRef = useRef<number | null>(null);
  const resumeAttemptedRef = useRef<string | null>(null);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current != null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const scheduleFeedback = useCallback((delayMs: number, fn: () => void) => {
    clearFeedbackTimer();
    feedbackTimerRef.current = window.setTimeout(fn, delayMs);
  }, [clearFeedbackTimer]);

  useEffect(() => () => clearFeedbackTimer(), [clearFeedbackTimer]);

  const finishRun = useCallback(
    (wasCorrect: boolean | null) => {
      const completedPlayId = session?.playId ?? options.playIdFromUrl ?? null;
      setLastCorrect(wasCorrect);
      setFinished(true);
      setQuestion(null);
      setFeedback(null);
      setSelectedOptionId(null);
      setStreak(0);
      if (completedPlayId && options.onRunFinished) {
        options.onRunFinished(completedPlayId);
      } else {
        options.onPlayIdChange(null);
      }
    },
    [options, session?.playId],
  );

  const handleServerPlayClosed = useCallback(
    (payload: GameRuntimeStateSyncPayload) => {
      if (finished) return;
      if (typeof payload.scoreInRun === 'number') {
        setScoreInRun(payload.scoreInRun);
      }
      finishRun(payload.correct ?? null);
    },
    [finishRun, finished],
  );

  const handleServerStateSync = useCallback(
    (payload: GameRuntimeStateSyncPayload) => {
      if (finished) return;
      if (typeof payload.scoreInRun === 'number') {
        setScoreInRun(payload.scoreInRun);
      }
      if (payload.completed) {
        finishRun(payload.correct ?? null);
      }
    },
    [finishRun, finished],
  );

  const { socket: socketRef, wsReady: wsReadyRef } = useGameRuntimeSocket({
    playId: session?.playId ?? null,
    enabled: Boolean(session?.playId && !finished),
    events: {
      JOIN: options.wsEvents.JOIN,
      JOINED: options.wsEvents.JOINED,
      TIMER_SYNC: options.wsEvents.TIMER_SYNC,
      STATE_SYNC: options.wsEvents.STATE_SYNC,
      PLAY_CLOSED: options.wsEvents.PLAY_CLOSED,
    },
    fetchAccessToken: options.fetchWsAccessToken,
    connectSocket: options.connectSocket,
    onTimerSecondsLeft: setServerTimerSecondsLeft,
    onStateSync: handleServerStateSync,
    onPlayClosed: handleServerPlayClosed,
  });

  const resetRunState = useCallback(() => {
    clearFeedbackTimer();
    setSession(null);
    setQuestion(null);
    setScoreInRun(0);
    setFinished(false);
    setLastCorrect(null);
    setFeedback(null);
    setSelectedOptionId(null);
    setStreak(0);
    setActionError(null);
    options.resetSessionExtras?.();
  }, [clearFeedbackTimer, options]);

  const handleStart = useCallback(async () => {
    resetRunState();
    options.onPlayIdChange(null);
    setStarting(true);

    try {
      const started = await options.startSession();
      setSession(options.toSessionFromStart(started));
      setQuestion(started.question);
      setScoreInRun(started.scoreInRun);
      setStreak(started.streak ?? 0);
      options.onPlayIdChange(started.playId);
      options.onSessionStarted?.(started);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không bắt đầu được lượt chơi.';
      if (options.onStartError) {
        options.onStartError(message);
      } else {
        setActionError(message);
      }
    } finally {
      setStarting(false);
    }
  }, [options, resetRunState]);

  const submitAnswer = useCallback(
    async (submitOpts: SubmitOptions) => {
      if (!session || !question || submitting || feedback) return;

      primeGameAudio();
      setSubmitting(true);
      if (submitOpts.selectedOptionId) {
        setSelectedOptionId(submitOpts.selectedOptionId);
      }
      setActionError(null);

      const questionId = options.getQuestionId(question);

      try {
        const wsPayload = {
          playId: session.playId,
          questionId,
          ...(submitOpts.selectedOptionId ? { selectedOptionId: submitOpts.selectedOptionId } : {}),
          ...(submitOpts.timedOut ? { timedOut: true } : {}),
        };

        const result = await submitGameAnswerViaWsOrHttp({
          socket: socketRef.current,
          wsReady: wsReadyRef.current,
          events: {
            ANSWER: options.wsEvents.ANSWER,
            ANSWER_ACK: options.wsEvents.ANSWER_ACK,
            ERROR: options.wsEvents.ERROR,
          },
          payload: wsPayload,
          httpSubmit: () =>
            options.submitAnswerHttp(session.playId, questionId, submitOpts),
        });

        options.onAnswerResult({
          result,
          session,
          question,
          setQuestion,
          setScoreInRun,
          setStreak,
          setLastCorrect,
          setFeedback,
          setSelectedOptionId,
          setSubmitting,
          finishRun,
          clearFeedbackTimer,
          scheduleFeedback,
        });
      } catch (err) {
        setSubmitting(false);
        setSelectedOptionId(null);
        const message =
          err instanceof Error ? err.message : 'Không gửi được câu trả lời.';
        if (options.onSubmitError) {
          options.onSubmitError(message);
        } else {
          setActionError(message);
        }
      }
    },
    [feedback, finishRun, options, question, scheduleFeedback, session, socketRef, submitting, wsReadyRef],
  );

  const handleAnswer = useCallback(
    (optionId: string) => void submitAnswer({ selectedOptionId: optionId }),
    [submitAnswer],
  );

  const handleTimeout = useCallback(
    () => void submitAnswer({ timedOut: true }),
    [submitAnswer],
  );

  useEffect(() => {
    if (!options.playIdFromUrl || session || finished) return;
    if (resumeAttemptedRef.current === options.playIdFromUrl) return;

    resumeAttemptedRef.current = options.playIdFromUrl;
    let cancelled = false;

    (async () => {
      setResuming(true);
      setActionError(null);

      try {
        await resumeGameSession<TSession, TQuestion>({
          playId: options.playIdFromUrl!,
          prefetchedPayload:
            options.prefetchedPlayPayload?.playId === options.playIdFromUrl
              ? options.prefetchedPlayPayload
              : undefined,
          fetchSession: options.fetchSession,
          toSession: options.toSessionFromResume,
          onCompleted: (completedSession, resumeCtx) => {
            if (cancelled) return;
            setSession(completedSession);
            setScoreInRun(resumeCtx.scoreInRun);
            options.onSessionCompletedFromResume?.(completedSession, resumeCtx);
            finishRun(resumeCtx.lastAnswerCorrect ?? null);
          },
          onActive: (activeSession, activeQuestion, resumeCtx) => {
            if (cancelled) return;
            setSession(activeSession);
            setQuestion(activeQuestion);
            setScoreInRun(activeSession.scoreInRun);
            setStreak(activeSession.streak);
            options.onSessionResumed?.(activeSession, activeQuestion, resumeCtx);
          },
          onError: (message) => {
            if (cancelled) return;
            if (options.onResumeError) {
              options.onResumeError(message);
            } else {
              setActionError(message);
            }
            options.onPlayIdChange(null);
          },
        });
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Không khôi phục được lượt chơi.';
          if (options.onResumeError) {
            options.onResumeError(message);
          } else {
            setActionError(message);
          }
          options.onPlayIdChange(null);
        }
      } finally {
        setResuming(false);
      }
    })();

    return () => {
      cancelled = true;
      resumeAttemptedRef.current = null;
    };
  }, [finishRun, finished, options.playIdFromUrl, options.prefetchedPlayPayload, session]);

  const optionsLocked = submitting || feedback !== null || resuming || starting;

  const timerAnchorId =
    options.getTimerAnchorId?.(session, question) ??
    (question ? options.getQuestionId(question) : null);

  const { secondsLeft, totalSeconds } = useGameQuestionTimer({
    questionId: timerAnchorId,
    enabled: Boolean(session && question && !finished),
    paused: optionsLocked,
    seconds: options.answerTimeoutSec,
    onTimeout: handleTimeout,
    serverSecondsLeft: serverTimerSecondsLeft,
  });

  useEffect(() => {
    setServerTimerSecondsLeft(null);
  }, [question]);

  const abandonSession = useCallback(async () => {
    const playId = session?.playId ?? options.playIdFromUrl;
    if (!playId || !options.abandonSessionHttp) {
      return;
    }
    setActionError(null);
    try {
      await options.abandonSessionHttp(playId);
      clearFeedbackTimer();
      setSession(null);
      setQuestion(null);
      setFinished(true);
      setFeedback(null);
      setSelectedOptionId(null);
      options.onRunFinished?.(playId);
      options.onPlayIdChange(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không kết thúc được lượt chơi.';
      setActionError(message);
      throw err;
    }
  }, [clearFeedbackTimer, options, session?.playId]);

  return {
    session,
    question,
    scoreInRun,
    streak,
    submitting,
    starting,
    resuming,
    finished,
    lastCorrect,
    feedback,
    selectedOptionId,
    optionsLocked,
    actionError,
    secondsLeft,
    totalSeconds,
    setActionError,
    handleStart,
    handleAnswer,
    abandonSession,
  };
}
