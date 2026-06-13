/**
 * Quiz Attempt Runtime Hook
 * Main orchestrator hook for quiz attempt workflow
 *
 * Responsibilities:
 * - Manages quiz attempt state machine
 * - Coordinates timer, websocket, and persistence hooks
 * - Handles form loading and attempt lifecycle
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type {
  QuizAttemptHistoryItem,
  QuizAttemptTimerSlice,
  QuizPublishedFormPayload,
  StartAttemptResponse,
  SubmitAttemptResponse,
} from '@/features/quiz-test/types';
import {
  buildRemainingPlaysByListeningUnitFromForm,
  quizSectionListeningStorageKey,
} from '@/features/quiz-test/lib/quiz-listening-rules';
import { sortQuizFormSections } from '@/features/quiz-test/lib/quiz-section-meta';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import {
  fetchQuizRuntimeJson,
  quizRuntimeErrorMessage,
} from '@/features/quiz-test/lib/quiz-runtime-http';
import {
  fetchQuizStartEligibility,
  postQuizResultSync,
} from '@/lib/quiz-assignment-crm';
import { QuizAssignmentUiMessages } from '@/lib/quiz-assignment-ui-messages';
import {
  getHistoryAssignmentId,
  normalizeQuizAttemptHistoryItems,
} from '@/features/quiz-test/lib/quiz-attempt-history';
import { pinAssignmentQuizRuntimeAccess } from '@/lib/quiz-runtime-access';
import { fetchActiveQuizAttemptState, invalidateActiveQuizAttemptCache } from '@/lib/quiz-resume-access';
import {
  applyServerTimerSlice,
  normalizeAttemptAnswers,
  toValidAttemptPayload,
  syncRemainingFromAttempt,
  REMAINING_UNSET,
  getAttemptTimerValidity,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { mergeAttemptWithFormPublishedDuration } from '@/features/quiz-test/lib/quiz-attempt-merge';
import { getQuizFormContext } from '@/lib/quiz-form-context';
import {
  QUIZ_WS,
  connectQuizRuntimeSocket,
  fetchQuizWsAccessToken,
} from '@/features/quiz-test/quiz-runtime-ws-client';
import {
  isQuizAttemptMutationBlockedResponse,
  pollAttemptUntilTerminal,
  submitResponseFromAttemptSnapshot,
} from '@/features/quiz-test/lib/quiz-attempt-deadline-close';
import {
  isQuizAttemptEditingLocked,
  QUIZ_ATTEMPT_DEADLINE_USER_MESSAGE,
  type QuizAttemptCloseReason,
} from '@/features/quiz-test/lib/quiz-attempt-session-lock';
import {
  sanitizeStudentFacingMessage,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import { useQuizAttemptDeadlineClose } from '@/features/quiz-test/lib/useQuizAttemptDeadlineClose';
import { message as antdMessage } from 'antd';

// ============================================================================
// Types
// ============================================================================

export type { QuizAttemptPhase } from '@/features/quiz-test/lib/quiz-attempt-session-lock';
import type { QuizAttemptPhase } from '@/features/quiz-test/lib/quiz-attempt-session-lock';

type UseQuizAttemptRuntimeArgs = {
  formPublicId: string;
  /** Khi mở từ bài tập — sau nộp gọi CRM đồng bộ điểm */
  assignmentId?: number;
  /** Ôn luyện — `?mode=practice` trên proxy + snapshot */
  practiceMode?: boolean;
};

function quizRuntimeQuerySuffix(
  assignmentId?: number,
  practiceMode?: boolean,
): string {
  const sp = new URLSearchParams();
  if (assignmentId != null && assignmentId >= 1) {
    sp.set('assignmentId', String(assignmentId));
  } else if (practiceMode) {
    sp.set('mode', 'practice');
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

// ============================================================================
// Utility Functions
// ============================================================================

function normalizeListeningMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n)) o[String(k)] = n;
  }
  return o;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useQuizAttemptRuntime({
  formPublicId,
  assignmentId,
  practiceMode,
}: UseQuizAttemptRuntimeArgs) {
  const querySuffix = quizRuntimeQuerySuffix(assignmentId, practiceMode);
  // Core state
  const [phase, setPhase] = useState<QuizAttemptPhase>('loading_form');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [formPayload, setFormPayload] = useState<QuizPublishedFormPayload | null>(null);
  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitResult, setSubmitResult] = useState<SubmitAttemptResponse | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistoryItem[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(REMAINING_UNSET);
  const [rulesAcknowledged, setRulesAcknowledged] = useState(false);
  const [listeningRemaining, setListeningRemaining] = useState<Record<string, number>>({});
  const listeningRemainingRef = useRef<Record<string, number>>({});
  listeningRemainingRef.current = listeningRemaining;
  const manualListeningStartedRef = useRef<Set<number>>(new Set());
  const [manualListeningStartedVersion, setManualListeningStartedVersion] =
    useState(0);
  /** Hết giờ / đang nộp — khóa sửa đáp án trên UI. */
  const [sessionLocked, setSessionLocked] = useState(false);
  const [closeReason, setCloseReason] = useState<QuizAttemptCloseReason>(null);

  // Refs for async callbacks
  const autoSubmitTriggeredRef = useRef(false);
  const resetDeadlineCloseRef = useRef<() => void>(() => undefined);

  const applyServerTimerToAttempt = useCallback(
    (timer: unknown, status?: string) => {
      const t =
        timer && typeof timer === 'object' && !Array.isArray(timer)
          ? (timer as QuizAttemptTimerSlice)
          : null;
      if (t) {
        setAttempt((prev) => {
          if (!prev) return prev;
          const next = applyServerTimerSlice(prev, t);
          setRemainingSeconds(syncRemainingFromAttempt(next));
          return next;
        });
      }
      if (status === 'submitted') {
        autoSubmitTriggeredRef.current = true;
      }
    },
    [],
  );
  const quizSocketRef = useRef<Socket | null>(null);
  /** Luôn có đáp án mới nhất khi nộp bài (tránh closure React lệch câu vừa chọn). */
  const answersRef = useRef<Record<string, string | string[]>>({});
  const phaseRef = useRef<QuizAttemptPhase>(phase);
  phaseRef.current = phase;

  // ============================================================================
  // Form Loading
  // ============================================================================

  const fetchFormPayload = useCallback(async (opts?: { resume?: boolean }): Promise<QuizPublishedFormPayload> => {
    const suffix = opts?.resume ? '' : querySuffix;
    const url = quizRuntimePublicUrl(`forms/${formPublicId}${suffix}`);
    const { ok, status, data } = await fetchQuizRuntimeJson<
      QuizPublishedFormPayload & { message?: string }
    >(url);

    if (!ok) {
      throw new Error(quizRuntimeErrorMessage(status, data, 'load'));
    }

    return data;
  }, [formPublicId, querySuffix]);

  const loadForm = useCallback(async () => {
    setPhase('loading_form');
    setErrMsg(null);

    try {
      const activeState = await fetchActiveQuizAttemptState(formPublicId);
      const resumeInProgress = activeState?.state === 'in_progress';
      const rawAttempt =
        resumeInProgress && activeState?.attempt
          ? (activeState.attempt as Record<string, unknown>)
          : null;

      if (rawAttempt) {
        const aidFromAttempt = getHistoryAssignmentId(rawAttempt);
        if (aidFromAttempt != null && aidFromAttempt >= 1 && assignmentId == null) {
          pinAssignmentQuizRuntimeAccess(formPublicId, aidFromAttempt);
        }
      }

      let data: QuizPublishedFormPayload;
      let nextHistory: QuizAttemptHistoryItem[] = [];

      if (resumeInProgress) {
        data = await fetchFormPayload({ resume: true });
        void fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(
          quizRuntimePublicUrl(`forms/${formPublicId}/attempts`),
        ).then((res) => {
          if (res.ok && res.data) {
            setAttemptHistory(normalizeQuizAttemptHistoryItems(res.data.items));
          }
        });
      } else {
        const [historyRes, loaded] = await Promise.all([
          fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(
            quizRuntimePublicUrl(`forms/${formPublicId}/attempts${querySuffix}`),
          ),
          fetchFormPayload(),
        ]);
        data = loaded;
        nextHistory = normalizeQuizAttemptHistoryItems(historyRes.data?.items);
      }

      setAttemptHistory(nextHistory);
      setFormPayload(data);

      if (resumeInProgress && rawAttempt) {
        const resumed = toValidAttemptPayload(rawAttempt, formPublicId);
        if (resumed) {
          let merged = mergeAttemptWithFormPublishedDuration(resumed, data);
          const rawTimer = rawAttempt.timer;
          if (rawTimer) {
            merged = applyServerTimerSlice(merged, rawTimer as QuizAttemptTimerSlice);
          }
          autoSubmitTriggeredRef.current = false;
          resetDeadlineCloseRef.current();
          setSessionLocked(false);
          setCloseReason(null);
          setAttempt(merged);
          const resumedAnswers = normalizeAttemptAnswers(
            rawAttempt.answersByFormItemId,
          );
          answersRef.current = resumedAnswers;
          setAnswers(resumedAnswers);
          setListeningRemaining(
            normalizeListeningMap(rawAttempt.remainingPlaysByListeningUnit),
          );
          setRemainingSeconds(syncRemainingFromAttempt(merged));
          setPhase('attempting');
          return;
        }
      }

      if (activeState?.state === 'closed') {
        const attemptId = String(activeState.attempt?.attemptPublicId ?? '');
        setAttempt(null);
        setAnswers({});
        answersRef.current = {};
        setRemainingSeconds(REMAINING_UNSET);
        setListeningRemaining({});
        setSubmitResult({
          ok: true,
          attemptPublicId: attemptId,
          status: String(activeState.attempt?.status ?? activeState.reason),
          submittedAt:
            typeof activeState.attempt?.submittedAt === 'string'
              ? activeState.attempt.submittedAt
              : null,
          answersByFormItemId: activeState.attempt?.answersByFormItemId,
          grading: activeState.attempt?.grading,
        });
        setSessionLocked(true);
        setCloseReason(activeState.reason === 'expired' ? 'deadline' : 'manual');
        setErrMsg(
          activeState.reason === 'expired'
            ? 'Bài làm đã đóng do hết thời gian.'
            : 'Bài làm đã được nộp trước đó.',
        );
        setPhase('done');
        return;
      }

      setAttempt(null);
      setAnswers({});
      answersRef.current = {};
      setSubmitResult(null);
      setRemainingSeconds(REMAINING_UNSET);
      setListeningRemaining({});
      setPhase('ready');
    } catch (e) {
      setErrMsg(
        sanitizeStudentFacingMessage(
          e instanceof Error ? e.message : null,
          STUDENT_SAFE_USER_MESSAGES.quizLoadFailed,
        ),
      );
      setPhase('error');
    }
  }, [applyServerTimerToAttempt, assignmentId, fetchFormPayload, formPublicId, querySuffix]);

  const refreshHistory = useCallback(async () => {
    const historyUrl = quizRuntimePublicUrl(`forms/${formPublicId}/attempts${querySuffix}`);
    try {
      const historyRes = await fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(
        historyUrl,
      );
      if (historyRes.ok && historyRes.data) {
        const nextHistory = normalizeQuizAttemptHistoryItems(historyRes.data.items);
        setAttemptHistory(nextHistory);
        return nextHistory;
      }
    } catch {
      // Silently fail on refresh
    }
    return [];
  }, [formPublicId, querySuffix]);

  // ============================================================================
  // Submit Attempt
  // ============================================================================

  const disconnectQuizSocket = useCallback(() => {
    const s = quizSocketRef.current;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
    quizSocketRef.current = null;
  }, []);

  const finalizeAttemptSubmitted = useCallback(
    async (
      submitted: SubmitAttemptResponse,
      userMessage: string | null,
      reason: QuizAttemptCloseReason,
    ) => {
      autoSubmitTriggeredRef.current = true;
      setSessionLocked(true);
      setCloseReason(reason);
      disconnectQuizSocket();
      setSubmitResult(submitted);
      setErrMsg(userMessage);
      if (userMessage) {
        antdMessage.warning(userMessage);
      }

      void refreshHistory();
      invalidateActiveQuizAttemptCache(formPublicId);

      if (
        assignmentId != null &&
        Number.isFinite(assignmentId) &&
        assignmentId >= 1 &&
        submitted?.attemptPublicId?.trim()
      ) {
        try {
          const syncOk = await postQuizResultSync(
            assignmentId,
            submitted.attemptPublicId.trim(),
          );
          if (!syncOk) {
            antdMessage.warning(
              QuizAssignmentUiMessages.syncScoreToAssignmentFailed,
            );
          }
        } catch {
          antdMessage.warning(QuizAssignmentUiMessages.syncNetworkError);
        }
      }

      setPhase('done');
    },
    [assignmentId, disconnectQuizSocket, formPublicId, practiceMode, refreshHistory],
  );

  const lockAttemptSession = useCallback(
    (message: string | null) => {
      setSessionLocked(true);
      if (message) setErrMsg(message);
    },
    [],
  );

  const runDeadlineCloseFlowRef = useRef<(attemptId: string) => void>(() => undefined);
  const markServerClosedRef = useRef<() => void>(() => undefined);

  // ============================================================================
  // Answer Persistence
  // ============================================================================

  const persistAnswersRealtime = useCallback(
    (next: Record<string, string | string[]>, attemptPublicId: string) => {
      if (sessionLocked) return;
      const p = phaseRef.current;
      if (p === 'submitting' || p === 'done') return;

      const patchRest = async () => {
        const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
        const { ok, status, data } = await fetchQuizRuntimeJson(url, {
          method: 'PATCH',
          body: JSON.stringify({ answersByFormItemId: next }),
        });
        if (!ok) {
          if (isQuizAttemptMutationBlockedResponse(status, data)) {
            lockAttemptSession(
              'Phiên làm bài đã kết thúc. Không thể thay đổi đáp án.',
            );
            markServerClosedRef.current();
            void runDeadlineCloseFlowRef.current(attemptPublicId);
            return;
          }
          antdMessage.warning(
            'Không lưu nháp được — kiểm tra mạng hoặc phiên làm bài đã hết hạn.',
          );
        }
      };

      const sock = quizSocketRef.current;
      if (sock?.connected) {
        sock.emit(
          QUIZ_WS.PATCH_ANSWERS,
          { attemptPublicId, answersByFormItemId: next },
          (ack: unknown) => {
            const a = ack as { event?: string; data?: { message?: string } };
            if (a?.event === QUIZ_WS.ANSWERS_ACK) return;
            if (
              a?.event === QUIZ_WS.ERROR &&
              /deadline|not in progress|expired/i.test(String(a.data?.message ?? ''))
            ) {
              lockAttemptSession(
                'Phiên làm bài đã kết thúc. Không thể thay đổi đáp án.',
              );
              markServerClosedRef.current();
              void runDeadlineCloseFlowRef.current(attemptPublicId);
              return;
            }
            void patchRest();
          },
        );
        return;
      }
      void patchRest();
    },
    [lockAttemptSession, sessionLocked],
  );

  const patchAnswersImmediately = useCallback(
    async (
      attemptPublicId: string,
      map?: Record<string, string | string[]>,
    ) => {
      if (sessionLocked) return false;
      const payload = map ?? answersRef.current;
      const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
      const { ok, status, data } = await fetchQuizRuntimeJson(url, {
        method: 'PATCH',
        body: JSON.stringify({ answersByFormItemId: payload }),
      });
      if (!ok) {
        if (isQuizAttemptMutationBlockedResponse(status, data)) {
          lockAttemptSession(
            'Phiên làm bài đã kết thúc. Không thể thay đổi đáp án.',
          );
          markServerClosedRef.current();
          void runDeadlineCloseFlowRef.current(attemptPublicId);
          return false;
        }
        antdMessage.warning(
          'Không lưu nháp được — kiểm tra mạng hoặc phiên làm bài đã hết hạn.',
        );
        return false;
      }
      return true;
    },
    [lockAttemptSession, sessionLocked],
  );

  const handleSubmit = useCallback(async () => {
    const attemptId = attempt?.attemptPublicId?.trim();
    if (!attemptId) {
      setErrMsg('Không tìm thấy phiên làm bài hợp lệ để nộp.');
      setPhase('ready');
      return;
    }

    setPhase('submitting');
    setErrMsg(null);
    lockAttemptSession(null);
    disconnectQuizSocket();

    const finalAnswers = { ...answersRef.current, ...answers };
    answersRef.current = finalAnswers;

    const saved = await patchAnswersImmediately(attemptId, finalAnswers);
    if (!saved) {
      setSessionLocked(false);
      setPhase('attempting');
      return;
    }

    const url = quizRuntimePublicUrl(`attempts/${attemptId}/submit`);

    try {
      const { ok, status, data } = await fetchQuizRuntimeJson<
        SubmitAttemptResponse & { message?: string }
      >(url, {
        method: 'POST',
        body: JSON.stringify({ answersByFormItemId: finalAnswers }),
      });

      if (!ok) {
        throw new Error(quizRuntimeErrorMessage(status, data, 'submit'));
      }

      await finalizeAttemptSubmitted(
        data as SubmitAttemptResponse,
        null,
        'manual',
      );
    } catch (e) {
      setErrMsg(
        sanitizeStudentFacingMessage(
          e instanceof Error ? e.message : null,
          STUDENT_SAFE_USER_MESSAGES.quizSubmitFailed,
        ),
      );
      setSessionLocked(false);
      setPhase('attempting');
    }
  }, [
    answers,
    attempt,
    disconnectQuizSocket,
    finalizeAttemptSubmitted,
    lockAttemptSession,
    patchAnswersImmediately,
  ]);

  const {
    handleServerAttemptClosed,
    runDeadlineCloseFlow,
    resetDeadlineCloseState,
    markServerClosed,
    deadlineWaitMessage,
  } = useQuizAttemptDeadlineClose({
    finalizeSubmitted: finalizeAttemptSubmitted,
    requestSubmitFallback: handleSubmit,
  });
  resetDeadlineCloseRef.current = resetDeadlineCloseState;
  runDeadlineCloseFlowRef.current = runDeadlineCloseFlow;
  markServerClosedRef.current = markServerClosed;

  // ============================================================================
  // Start Attempt
  // ============================================================================

  const handleStart = useCallback(async () => {
    if (!formPayload) return;
    setPhase('starting');
    setErrMsg(null);

    const url = quizRuntimePublicUrl(`forms/${formPublicId}/attempts${querySuffix}`);

    try {
      if (assignmentId != null && assignmentId >= 1) {
        const gate = await fetchQuizStartEligibility(assignmentId);
        if (!gate.allowed) {
          throw new Error(gate.reason);
        }
      }

      const stored = getQuizFormContext(formPublicId);
      const snapshot =
        assignmentId != null && assignmentId >= 1
          ? {
              assignmentId,
              quizMaxAttempts:
                stored?.mode === 'assignment' && stored.assignmentId === assignmentId
                  ? (stored.quizMaxAttempts ?? null)
                  : null,
            }
          : practiceMode
            ? {
                mode: 'practice' as const,
                quizMaxAttempts:
                  stored?.mode === 'practice'
                    ? (stored.quizMaxAttempts ?? null)
                    : null,
              }
            : undefined;
      const startBody = snapshot
        ? JSON.stringify({ participantSnapshot: snapshot })
        : JSON.stringify({});

      const { ok, status, data } = await fetchQuizRuntimeJson<
        StartAttemptResponse & { message?: string }
      >(url, {
        method: 'POST',
        body: startBody,
      });

      if (!ok) {
        throw new Error(quizRuntimeErrorMessage(status, data, 'start'));
      }

      invalidateActiveQuizAttemptCache(formPublicId);

      const layoutForm = await fetchFormPayload();
      setFormPayload(layoutForm);

      const mergedStart = mergeAttemptWithFormPublishedDuration(data, layoutForm);
      setAttempt(mergedStart);
      setListeningRemaining(
        normalizeListeningMap(
          (data as { remainingPlaysByListeningUnit?: unknown })
            ?.remainingPlaysByListeningUnit,
        ),
      );
      autoSubmitTriggeredRef.current = false;
      resetDeadlineCloseRef.current();
      setSessionLocked(false);
      setCloseReason(null);
      setRemainingSeconds(syncRemainingFromAttempt(mergedStart));
      if (!data.resumed) {
        setAnswers({});
        answersRef.current = {};
        manualListeningStartedRef.current.clear();
        setManualListeningStartedVersion((v) => v + 1);
      }
      setPhase('attempting');
    } catch (e) {
      setErrMsg(
        sanitizeStudentFacingMessage(
          e instanceof Error ? e.message : null,
          STUDENT_SAFE_USER_MESSAGES.quizLoadFailed,
        ),
      );
      setPhase('confirm_start');
    }
  }, [assignmentId, fetchFormPayload, formPayload, formPublicId, practiceMode, querySuffix]);

  const onAnswerChange = useCallback(
    (formItemId: string, value: string | string[]) => {
      if (!attempt?.attemptPublicId) return;
      if (isQuizAttemptEditingLocked(phase, sessionLocked)) return;
      setAnswers((prev) => {
        const next = { ...prev, [formItemId]: value };
        answersRef.current = next;
        persistAnswersRealtime(next, attempt.attemptPublicId);
        return next;
      });
    },
    [attempt, persistAnswersRealtime, phase, sessionLocked],
  );

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  // ============================================================================
  // Timer Logic
  // ============================================================================

  useEffect(() => {
    if (phase !== 'attempting' || !attempt) return;

    const timerValidity = getAttemptTimerValidity(attempt);
    if (!timerValidity.ok) {
      setRemainingSeconds(REMAINING_UNSET);
      return;
    }

    // Calculate initial tick
    const tick = () => syncRemainingFromAttempt(attempt);

    setRemainingSeconds(tick());

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (!Number.isFinite(prev) || prev === REMAINING_UNSET) return prev;
        const next = Math.max(0, prev - 1);
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [attempt, phase]);

  // Hết giờ: khóa UI ngay, chờ server (WS / poll) rồi chuyển trang chi tiết.
  useEffect(() => {
    if (phase !== 'attempting' || !attempt?.attemptPublicId) return;
    if (!getAttemptTimerValidity(attempt).ok) return;
    if (!Number.isFinite(remainingSeconds) || remainingSeconds === REMAINING_UNSET) return;
    if (remainingSeconds > 0 || autoSubmitTriggeredRef.current) return;

    autoSubmitTriggeredRef.current = true;
    lockAttemptSession(deadlineWaitMessage);
    void runDeadlineCloseFlow(attempt.attemptPublicId);
  }, [
    attempt,
    deadlineWaitMessage,
    lockAttemptSession,
    phase,
    remainingSeconds,
    runDeadlineCloseFlow,
  ]);

  // ============================================================================
  // WebSocket Connection
  // ============================================================================

  useEffect(() => {
    if (phase !== 'attempting' || !attempt?.attemptPublicId) {
      quizSocketRef.current?.removeAllListeners();
      quizSocketRef.current?.disconnect();
      quizSocketRef.current = null;
      return;
    }

    let cancelled = false;
    const attemptId = attempt.attemptPublicId;

    const connectSocket = async () => {
      const token = await fetchQuizWsAccessToken();
      if (cancelled || !token) return;

      try {
        const sock = connectQuizRuntimeSocket(token);
        quizSocketRef.current = sock;

        sock.on('connect_error', () => undefined);

        // Answer sync from server
        sock.on(QUIZ_WS.ANSWERS_SYNC, (payload: unknown) => {
          const p = payload as {
            attemptPublicId?: string;
            answersByFormItemId?: Record<string, unknown>;
          };
          if (p?.attemptPublicId !== attemptId) return;
          setAnswers((prev) => {
            const merged = {
              ...prev,
              ...normalizeAttemptAnswers(p.answersByFormItemId),
            };
            answersRef.current = merged;
            return merged;
          });
        });

        sock.on(QUIZ_WS.ATTEMPT_CLOSED, (payload: unknown) => {
          void handleServerAttemptClosed(payload, attemptId);
        });

        // Listening state sync
        sock.on(QUIZ_WS.LISTENING_STATE_SYNC, (payload: unknown) => {
          const p = payload as {
            attemptPublicId?: string;
            remainingPlaysByListeningUnit?: unknown;
          };
          if (p?.attemptPublicId !== attemptId) return;
          setListeningRemaining(normalizeListeningMap(p.remainingPlaysByListeningUnit));
        });

        const sendJoin = () => {
          sock.emit(QUIZ_WS.JOIN, { attemptPublicId: attemptId }, (ack: unknown) => {
            const a = ack as {
              event?: string;
              data?: {
                snapshot?: {
                  answersByFormItemId?: Record<string, unknown>;
                  timer?: unknown;
                  status?: string;
                };
              };
            };
            const snap = a?.data?.snapshot;
            if (a?.event !== QUIZ_WS.JOINED || !snap) return;

            const raw = snap.answersByFormItemId;
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
              setAnswers((prev) => {
                const merged = {
                  ...normalizeAttemptAnswers(raw),
                  ...prev,
                };
                answersRef.current = merged;
                return merged;
              });
            }
            applyServerTimerToAttempt(snap.timer, snap.status);
            if (snap.status === 'submitted' || snap.status === 'expired') {
              void (async () => {
                const terminal = await pollAttemptUntilTerminal(attemptId, {
                  maxMs: 5000,
                });
                if (!terminal) return;
                const submitted = submitResponseFromAttemptSnapshot(terminal.snapshot);
                if (submitted) {
                  await finalizeAttemptSubmitted(
                    submitted,
                    QUIZ_ATTEMPT_DEADLINE_USER_MESSAGE,
                    'deadline',
                  );
                }
              })();
            }
          });
        };

        if (sock.connected) {
          sendJoin();
        }
        sock.on('connect', sendJoin);
        sock.on(QUIZ_WS.TIMER_SYNC_ACK, (payload: unknown) => {
          const p = payload as {
            attemptPublicId?: string;
            timer?: unknown;
            status?: string;
          };
          if (p?.attemptPublicId !== attemptId) return;
          applyServerTimerToAttempt(p.timer, p.status);
        });
      } catch {
        /* REST autosave fallback */
      }
    };

    void connectSocket();

    return () => {
      cancelled = true;
      const s = quizSocketRef.current;
      if (s) {
        s.removeAllListeners();
        s.disconnect();
      }
      quizSocketRef.current = null;
    };
  }, [
    applyServerTimerToAttempt,
    finalizeAttemptSubmitted,
    handleServerAttemptClosed,
    phase,
    attempt?.attemptPublicId,
  ]);

  useEffect(() => {
    if (phase !== 'attempting' || !attempt?.attemptPublicId) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const sock = quizSocketRef.current;
      if (!sock?.connected) return;
      sock.emit(QUIZ_WS.TIMER_SYNC, { attemptPublicId: attempt.attemptPublicId }, (ack: unknown) => {
        const a = ack as {
          event?: string;
          data?: { timer?: unknown; status?: string };
        };
        if (a?.event === QUIZ_WS.TIMER_SYNC_ACK) {
          applyServerTimerToAttempt(a.data?.timer, a.data?.status);
          if (
            a.data?.status === 'submitted' ||
            a.data?.status === 'expired'
          ) {
            const aid = attempt.attemptPublicId;
            void (async () => {
              const terminal = await pollAttemptUntilTerminal(aid, { maxMs: 5000 });
              if (!terminal) return;
              const submitted = submitResponseFromAttemptSnapshot(terminal.snapshot);
              if (submitted) {
                await finalizeAttemptSubmitted(
                  submitted,
                  QUIZ_ATTEMPT_DEADLINE_USER_MESSAGE,
                  'deadline',
                );
              }
            })();
          }
        }
      });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [applyServerTimerToAttempt, attempt?.attemptPublicId, finalizeAttemptSubmitted, phase]);

  // ============================================================================
  // UI Actions
  // ============================================================================

  const openConfirmStart = useCallback(() => {
    setRulesAcknowledged(false);
    setPhase('confirm_start');
  }, []);

  const reportListeningCycle = useCallback(
    async (formItemId: string): Promise<boolean> => {
      const id = attempt?.attemptPublicId?.trim();
      const key = formItemId.trim();
      if (!id || !key) return false;

      const before = listeningRemainingRef.current[key];
      if (typeof before !== 'number' || before <= 0) return true;

      setListeningRemaining((prev) => ({ ...prev, [key]: before - 1 }));

      const url = quizRuntimePublicUrl(`attempts/${id}/listening-cycle`);
      const { ok, data } = await fetchQuizRuntimeJson<{
        remainingPlaysByListeningUnit?: unknown;
      }>(url, {
        method: 'POST',
        body: JSON.stringify({ formItemId: key }),
      });

      if (ok) {
        setListeningRemaining(normalizeListeningMap(data?.remainingPlaysByListeningUnit));
        return true;
      }

      setListeningRemaining((prev) => ({ ...prev, [key]: before }));
      antdMessage.warning('Không cập nhật được lượt nghe — thử tải lại trang nếu lỗi lặp lại.');
      return false;
    },
    [attempt?.attemptPublicId],
  );

  const forfeitListeningSection = useCallback(
    async (formItemKey: string) => {
      const id = attempt?.attemptPublicId?.trim();
      const key = formItemKey.trim();
      if (!id || !key) return;

      const before = listeningRemainingRef.current[key];
      if (typeof before !== 'number' || before <= 0) return;

      setListeningRemaining((prev) => ({ ...prev, [key]: 0 }));

      const url = quizRuntimePublicUrl(`attempts/${id}/listening-forfeit`);
      const { ok, data } = await fetchQuizRuntimeJson<{
        remainingPlaysByListeningUnit?: unknown;
      }>(url, {
        method: 'POST',
        body: JSON.stringify({ formItemId: key }),
      });

      if (ok) {
        setListeningRemaining(normalizeListeningMap(data?.remainingPlaysByListeningUnit));
        return;
      }

      setListeningRemaining((prev) => ({ ...prev, [key]: before }));
      antdMessage.warning('Không khóa lượt nghe còn lại — thử lại.');
    },
    [attempt?.attemptPublicId],
  );

  const maybeForfeitListeningOnLeaveSection = useCallback(
    async (sectionId: number) => {
      if (!Number.isFinite(sectionId)) return;
      const key = quizSectionListeningStorageKey(sectionId);
      await forfeitListeningSection(key);
    },
    [forfeitListeningSection],
  );

  /** Forfeit các phần nghe trước `targetSectionId` khi vào phần qua URL (?section=) mà bỏ qua. */
  const forfeitPriorListeningSections = useCallback(
    async (targetSectionId: number) => {
      if (!Number.isFinite(targetSectionId) || !formPayload) return;

      const rawSections = Array.isArray(formPayload.sections)
        ? formPayload.sections
        : [];
      const orderedIds = sortQuizFormSections(rawSections).map((s) => s.sectionId);

      const targetIdx = orderedIds.indexOf(targetSectionId);
      if (targetIdx <= 0) return;

      const listeningKeys = buildRemainingPlaysByListeningUnitFromForm(formPayload);
      for (let i = 0; i < targetIdx; i += 1) {
        const key = quizSectionListeningStorageKey(orderedIds[i]!);
        if (!Object.prototype.hasOwnProperty.call(listeningKeys, key)) continue;
        const rem = listeningRemainingRef.current[key];
        if (typeof rem === 'number' && rem > 0) {
          await forfeitListeningSection(key);
        }
      }
    },
    [formPayload, forfeitListeningSection],
  );

  const startManualListeningSection = useCallback((sectionId: number) => {
    if (!Number.isFinite(sectionId)) return;
    manualListeningStartedRef.current.add(sectionId);
    setManualListeningStartedVersion((v) => v + 1);
  }, []);

  const isManualListeningSectionStarted = useCallback((sectionId: number) => {
    return manualListeningStartedRef.current.has(sectionId);
  }, [manualListeningStartedVersion]);

  // ============================================================================
  // Return
  // ============================================================================

  const answersLocked = isQuizAttemptEditingLocked(phase, sessionLocked);

  return {
    // State
    phase,
    errMsg,
    formPayload,
    attempt,
    answers,
    submitResult,
    attemptHistory,
    remainingSeconds,
    rulesAcknowledged,
    listeningRemaining,
    sessionLocked,
    closeReason,
    answersLocked,
    // Setters
    setRulesAcknowledged,
    setPhase,
    // Actions
    loadForm,
    handleStart,
    onAnswerChange,
    handleSubmit,
    openConfirmStart,
    reportListeningCycle,
    maybeForfeitListeningOnLeaveSection,
    forfeitPriorListeningSections,
    startManualListeningSection,
    isManualListeningSectionStarted,
    refreshHistory,
  };
}
