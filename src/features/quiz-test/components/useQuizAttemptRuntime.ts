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
  QuizAttemptStateResponse,
  QuizPublishedFormPayload,
  StartAttemptResponse,
  SubmitAttemptResponse,
} from '@/features/quiz-test/types';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import {
  fetchQuizStartEligibility,
  postQuizResultSync,
} from '@/lib/quiz-assignment-crm';
import { QuizAssignmentUiMessages } from '@/lib/quiz-assignment-ui-messages';
import { normalizeQuizAttemptHistoryItems } from '@/features/quiz-test/lib/quiz-attempt-history';
import {
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
  normalizeAnswersWsPayload,
} from '@/features/quiz-test/quiz-runtime-ws-client';
import { message as antdMessage } from 'antd';

// ============================================================================
// Types
// ============================================================================

export type QuizAttemptPhase =
  | 'loading_form'
  | 'ready'
  | 'confirm_start'
  | 'starting'
  | 'attempting'
  | 'submitting'
  | 'done'
  | 'error';

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

  // Refs for async callbacks
  const autoSubmitTriggeredRef = useRef(false);
  const quizSocketRef = useRef<Socket | null>(null);

  // ============================================================================
  // Form Loading
  // ============================================================================

  const loadForm = useCallback(async () => {
    setPhase('loading_form');
    setErrMsg(null);

    const url = quizRuntimePublicUrl(`forms/${formPublicId}${querySuffix}`);

    try {
      const { ok, status, data } = await fetchQuizRuntimeJson<
        QuizPublishedFormPayload & { message?: string }
      >(url);

      if (!ok) {
        const msg =
          typeof (data as { message?: string })?.message === 'string'
            ? (data as { message: string }).message
            : `HTTP ${String(status)}`;
        throw new Error(msg);
      }

      setFormPayload(data);

      // Fetch active attempt and history in parallel
      const [active, historyRes] = await Promise.all([
        fetchQuizRuntimeJson<QuizAttemptStateResponse>(
          quizRuntimePublicUrl(`forms/${formPublicId}/active-attempt${querySuffix}`),
        ),
        fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(
          quizRuntimePublicUrl(`forms/${formPublicId}/attempts${querySuffix}`),
        ),
      ]);

      const nextHistory = normalizeQuizAttemptHistoryItems(historyRes.data?.items);
      setAttemptHistory(nextHistory);

      // Handle active attempt state
      if (active.ok && active.data && typeof active.data === 'object') {
        const state = active.data as QuizAttemptStateResponse;

        if (state.state === 'in_progress') {
          const rawAttempt = state.attempt;
          const resumed = toValidAttemptPayload(rawAttempt, formPublicId);
          if (resumed) {
            const merged = mergeAttemptWithFormPublishedDuration(resumed, data);
            autoSubmitTriggeredRef.current = false;
            setAttempt(merged);
            setAnswers(
              normalizeAttemptAnswers(
                (rawAttempt as { answersByFormItemId?: unknown })?.answersByFormItemId,
              ),
            );
            setListeningRemaining(
              normalizeListeningMap(
                (rawAttempt as { remainingPlaysByListeningUnit?: unknown })
                  ?.remainingPlaysByListeningUnit,
              ),
            );
            setRemainingSeconds(syncRemainingFromAttempt(merged));
            setPhase('attempting');
            return;
          }
        }

        if (state.state === 'closed') {
          const attemptId = String(state.attempt?.attemptPublicId ?? '');
          setAttempt(null);
          setAnswers({});
          setRemainingSeconds(REMAINING_UNSET);
          setListeningRemaining({});
          setSubmitResult({
            ok: true,
            attemptPublicId: attemptId,
            status: String(state.attempt?.status ?? state.reason),
            submittedAt:
              typeof state.attempt?.submittedAt === 'string'
                ? state.attempt.submittedAt
                : null,
            answersByFormItemId: state.attempt?.answersByFormItemId,
            grading: state.attempt?.grading,
          });
          setErrMsg(
            state.reason === 'expired'
              ? 'Bài làm đã đóng do hết thời gian.'
              : 'Bài làm đã được nộp trước đó.',
          );
          setPhase('done');
          return;
        }
      }

      // Reset to ready state
      setAttempt(null);
      setAnswers({});
      setSubmitResult(null);
      setRemainingSeconds(REMAINING_UNSET);
      setListeningRemaining({});
      setPhase('ready');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Không tải được đề.');
      setPhase('error');
    }
  }, [formPublicId, querySuffix]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  // ============================================================================
  // Answer Persistence
  // ============================================================================

  const persistAnswersRealtime = useCallback(
    (next: Record<string, string | string[]>, attemptPublicId: string) => {
      const sock = quizSocketRef.current;
      if (sock?.connected) {
        sock.emit(
          QUIZ_WS.PATCH_ANSWERS,
          { attemptPublicId, answersByFormItemId: next },
          (ack: unknown) => {
            const a = ack as { event?: string };
            if (a?.event === QUIZ_WS.ERROR) {
              const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
              void fetch(url, {
                credentials: 'include',
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body: JSON.stringify({ answersByFormItemId: next }),
              }).catch(() => undefined);
            }
          },
        );
        return;
      }
      // REST fallback
      const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
      void fetch(url, {
        credentials: 'include',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ answersByFormItemId: next }),
      }).catch(() => undefined);
    },
    [],
  );

  const patchAnswersImmediately = useCallback(
    async (attemptPublicId: string, map: Record<string, string | string[]>) => {
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
    },
    [],
  );

  // ============================================================================
  // Start Attempt
  // ============================================================================

  const handleStart = useCallback(async () => {
    if (!formPayload) return;
    setPhase('starting');
    setErrMsg(null);

    const url = quizRuntimePublicUrl(`forms/${formPublicId}/attempts${querySuffix}`);

    try {
      // Check eligibility if from assignment
      if (assignmentId != null && assignmentId >= 1) {
        const gate = await fetchQuizStartEligibility(assignmentId);
        if (!gate.allowed) {
          throw new Error(gate.reason);
        }
      }

      // Start attempt
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
            ? { mode: 'practice' as const }
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
        throw new Error(
          typeof (data as { message?: string })?.message === 'string'
            ? (data as { message: string }).message
            : `HTTP ${status}`,
        );
      }

      const mergedStart = mergeAttemptWithFormPublishedDuration(data, formPayload);
      setAttempt(mergedStart);
      setListeningRemaining(
        normalizeListeningMap(
          (data as { remainingPlaysByListeningUnit?: unknown })
            ?.remainingPlaysByListeningUnit,
        ),
      );
      autoSubmitTriggeredRef.current = false;
      setRemainingSeconds(syncRemainingFromAttempt(mergedStart));
      if (!data.resumed) setAnswers({});
      setPhase('attempting');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Không tạo phiên làm bài được.');
      setPhase('confirm_start');
    }
  }, [assignmentId, formPayload, formPublicId, practiceMode, querySuffix]);

  // ============================================================================
  // Answer Change Handler
  // ============================================================================

  const onAnswerChange = useCallback(
    (formItemId: string, value: string | string[]) => {
      if (!attempt?.attemptPublicId) return;
      setAnswers((prev) => {
        const next = { ...prev, [formItemId]: value };
        persistAnswersRealtime(next, attempt.attemptPublicId);
        return next;
      });
    },
    [attempt, persistAnswersRealtime],
  );

  // ============================================================================
  // Submit Attempt
  // ============================================================================

  const handleSubmit = useCallback(async () => {
    const attemptId = attempt?.attemptPublicId?.trim();
    if (!attemptId) {
      setErrMsg('Không tìm thấy phiên làm bài hợp lệ để nộp.');
      setPhase('ready');
      return;
    }

    setPhase('submitting');
    setErrMsg(null);

    // Persist final answers
    await patchAnswersImmediately(attemptId, answers);

    const url = quizRuntimePublicUrl(`attempts/${attemptId}/submit`);

    try {
      const { ok, data } = await fetchQuizRuntimeJson<SubmitAttemptResponse & { message?: string }>(
        url,
        { method: 'POST' },
      );

      if (!ok) {
        throw new Error(
          typeof (data as { message?: string })?.message === 'string'
            ? (data as { message: string }).message
            : 'Nộp bài thất bại',
        );
      }

      const submitted = data as SubmitAttemptResponse;
      setSubmitResult(submitted);

      // Refresh history
      void refreshHistory();

      // Sync score to assignment (lần làm gần nhất → assignment_result)
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
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Nộp bài thất bại');
      setPhase('attempting');
    }
  }, [answers, assignmentId, attempt, patchAnswersImmediately]);

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
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((timerValidity.deadlineMs - Date.now()) / 1000));
      return remaining;
    };

    setRemainingSeconds(tick());

    // Start countdown interval
    const intervalId = setInterval(() => {
      const remaining = tick();
      setRemainingSeconds(remaining);
      if (remaining <= 0) clearInterval(intervalId);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [attempt, phase]);

  // Auto-submit on timeout
  useEffect(() => {
    if (phase !== 'attempting' || !attempt) return;
    if (!getAttemptTimerValidity(attempt).ok) return;
    if (!Number.isFinite(remainingSeconds) || remainingSeconds === REMAINING_UNSET) return;
    if (remainingSeconds > 0 || autoSubmitTriggeredRef.current) return;

    autoSubmitTriggeredRef.current = true;
    setErrMsg('Hết giờ làm bài. Hệ thống đang tự động nộp bài.');
    antdMessage.warning('Đã hết giờ, hệ thống tự động nộp bài.');
    void handleSubmit();
  }, [attempt, handleSubmit, phase, remainingSeconds]);

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
          setAnswers((prev) => ({
            ...prev,
            ...normalizeAnswersWsPayload(p.answersByFormItemId),
          }));
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

        // Join attempt room
        const sendJoin = () => {
          sock.emit(QUIZ_WS.JOIN, { attemptPublicId: attemptId }, (ack: unknown) => {
            const a = ack as {
              event?: string;
              data?: { snapshot?: { answersByFormItemId?: Record<string, unknown> } };
            };
            const raw = a?.data?.snapshot?.answersByFormItemId;
            if (a?.event === QUIZ_WS.JOINED && raw && typeof raw === 'object' && !Array.isArray(raw)) {
              setAnswers((prev) => ({
                ...normalizeAnswersWsPayload(raw as Record<string, unknown>),
                ...prev,
              }));
            }
          });
        };

        if (sock.connected) sendJoin();
        sock.on('connect', sendJoin);
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
  }, [phase, attempt?.attemptPublicId]);

  // ============================================================================
  // UI Actions
  // ============================================================================

  const openConfirmStart = useCallback(() => {
    setRulesAcknowledged(false);
    setPhase('confirm_start');
  }, []);

  const reportListeningCycle = useCallback(
    async (formItemId: string) => {
      const id = attempt?.attemptPublicId?.trim();
      if (!id || !formItemId.trim()) return;

      const url = quizRuntimePublicUrl(`attempts/${id}/listening-cycle`);
      const { ok, data } = await fetchQuizRuntimeJson<{
        remainingPlaysByListeningUnit?: unknown;
      }>(url, {
        method: 'POST',
        body: JSON.stringify({ formItemId: formItemId.trim() }),
      });

      if (ok) {
        setListeningRemaining(normalizeListeningMap(data?.remainingPlaysByListeningUnit));
      }
    },
    [attempt?.attemptPublicId],
  );

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
  // Return
  // ============================================================================

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
    refreshHistory,
  };
}
