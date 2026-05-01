'use client';

import { mergeAttemptWithFormPublishedDuration } from '@/features/quiz-test/lib/quiz-attempt-merge';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import {
  getAttemptTimerValidity,
  normalizeAttemptAnswers,
  REMAINING_UNSET,
  syncRemainingFromAttempt,
  toValidAttemptPayload,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import type {
  QuizAttemptHistoryItem,
  QuizAttemptStateResponse,
  QuizPublishedFormPayload,
  StartAttemptResponse,
  SubmitAttemptResponse,
} from '@/features/quiz-test/types';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import {
  QUIZ_WS,
  connectQuizRuntimeSocket,
  fetchQuizWsAccessToken,
  normalizeAnswersWsPayload,
} from '@/features/quiz-test/quiz-runtime-ws-client';
import { message as antdMessage } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

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
};

export function useQuizAttemptRuntime({ formPublicId }: UseQuizAttemptRuntimeArgs) {
  const [phase, setPhase] = useState<QuizAttemptPhase>('loading_form');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [formPayload, setFormPayload] = useState<QuizPublishedFormPayload | null>(null);
  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitResult, setSubmitResult] = useState<SubmitAttemptResponse | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistoryItem[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(REMAINING_UNSET);
  const [rulesAcknowledged, setRulesAcknowledged] = useState(false);
  const quizSocketRef = useRef<Socket | null>(null);
  const autoSubmitTriggeredRef = useRef(false);

  const loadForm = useCallback(async () => {
    setPhase('loading_form');
    setErrMsg(null);
    const url = quizRuntimePublicUrl(`forms/${formPublicId}`);
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
      const activeUrl = quizRuntimePublicUrl(`forms/${formPublicId}/active-attempt`);
      const historyUrl = quizRuntimePublicUrl(`forms/${formPublicId}/attempts`);
      const [active, historyRes] = await Promise.all([
        fetchQuizRuntimeJson<QuizAttemptStateResponse>(activeUrl),
        fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(historyUrl),
      ]);
      const nextHistory = Array.isArray(historyRes.data?.items) ? historyRes.data.items : [];
      setAttemptHistory(nextHistory);
      if (active.ok && active.data && typeof active.data === 'object') {
        const state = active.data as QuizAttemptStateResponse;
        if (state.state === 'in_progress') {
          const resumed = toValidAttemptPayload(state.attempt, formPublicId);
          if (resumed) {
            const merged = mergeAttemptWithFormPublishedDuration(resumed, data);
            autoSubmitTriggeredRef.current = false;
            setAttempt(merged);
            setAnswers(
              normalizeAttemptAnswers(
                (state.attempt as { answersByFormItemId?: unknown })?.answersByFormItemId,
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
          setSubmitResult({
            ok: true,
            attemptPublicId: attemptId,
            status: String(state.attempt?.status ?? state.reason),
            submittedAt:
              typeof state.attempt?.submittedAt === 'string' ? state.attempt.submittedAt : null,
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
      setAttempt(null);
      setAnswers({});
      setSubmitResult(null);
      setRemainingSeconds(REMAINING_UNSET);
      setPhase('ready');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Không tải được đề.');
      setPhase('error');
    }
  }, [formPublicId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const persistAnswersRealtime = useCallback(
    (next: Record<string, string | string[]>, attemptPublicId: string) => {
      const sock = quizSocketRef.current;
      if (sock?.connected) {
        sock.emit(QUIZ_WS.PATCH_ANSWERS, { attemptPublicId, answersByFormItemId: next }, (ack: unknown) => {
          const a = ack as { event?: string };
          if (a?.event === QUIZ_WS.ERROR) {
            const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
            void fetch(url, {
              credentials: 'include',
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ answersByFormItemId: next }),
            }).catch(() => undefined);
          }
        });
        return;
      }
      const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
      void fetch(url, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ answersByFormItemId: next }),
      }).catch(() => undefined);
    },
    [],
  );

  const patchAnswersImmediately = useCallback(async (attemptPublicId: string, map: Record<string, string | string[]>) => {
    const url = quizRuntimePublicUrl(`attempts/${attemptPublicId}/answers`);
    const { ok } = await fetchQuizRuntimeJson(url, {
      method: 'PATCH',
      body: JSON.stringify({ answersByFormItemId: map }),
    });
    if (!ok) antdMessage.warning('Không lưu nháp được — kiểm tra mạng hoặc phiên làm bài đã hết hạn.');
  }, []);

  const handleStart = useCallback(async () => {
    if (!formPayload) return;
    setPhase('starting');
    setErrMsg(null);
    const url = quizRuntimePublicUrl(`forms/${formPublicId}/attempts`);
    try {
      const { ok, status, data } = await fetchQuizRuntimeJson<
        StartAttemptResponse & { message?: string }
      >(url, {
        method: 'POST',
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
      autoSubmitTriggeredRef.current = false;
      setRemainingSeconds(syncRemainingFromAttempt(mergedStart));
      if (!data.resumed) setAnswers({});
      setPhase('attempting');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Không tạo phiên làm bài được.');
      setPhase('confirm_start');
    }
  }, [formPayload, formPublicId]);

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

  const handleSubmit = useCallback(async () => {
    const attemptId = attempt?.attemptPublicId?.trim();
    if (!attemptId) {
      setErrMsg('Không tìm thấy phiên làm bài hợp lệ để nộp.');
      setPhase('ready');
      return;
    }
    setPhase('submitting');
    setErrMsg(null);
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
      setSubmitResult(data as SubmitAttemptResponse);
      setPhase('done');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Nộp bài thất bại');
      setPhase('attempting');
    }
  }, [answers, attempt, patchAnswersImmediately]);

  useEffect(() => {
    if (phase !== 'attempting' || !attempt) return;
    const v = getAttemptTimerValidity(attempt);
    if (!v.ok) {
      setRemainingSeconds(REMAINING_UNSET);
      return;
    }
    const tick = () => Math.max(0, Math.ceil((v.deadlineMs - Date.now()) / 1000));
    setRemainingSeconds(tick());
    const iv = setInterval(() => {
      const remain = tick();
      setRemainingSeconds(remain);
      if (remain <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [attempt, phase]);

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

  useEffect(() => {
    if (phase !== 'attempting' || !attempt?.attemptPublicId) {
      quizSocketRef.current?.removeAllListeners();
      quizSocketRef.current?.disconnect();
      quizSocketRef.current = null;
      return;
    }

    let cancelled = false;
    const attemptId = attempt.attemptPublicId;
    void (async () => {
      const token = await fetchQuizWsAccessToken();
      if (cancelled || !token) return;
      try {
        const sock = connectQuizRuntimeSocket(token);
        quizSocketRef.current = sock;
        sock.on('connect_error', () => undefined);
        sock.on(QUIZ_WS.ANSWERS_SYNC, (payload: unknown) => {
          const p = payload as { attemptPublicId?: string; answersByFormItemId?: Record<string, unknown> };
          if (p?.attemptPublicId !== attemptId) return;
          setAnswers((prev) => ({ ...prev, ...normalizeAnswersWsPayload(p.answersByFormItemId) }));
        });
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
    })();

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

  const openConfirmStart = useCallback(() => {
    setRulesAcknowledged(false);
    setPhase('confirm_start');
  }, []);

  return {
    phase,
    errMsg,
    formPayload,
    attempt,
    answers,
    submitResult,
    attemptHistory,
    remainingSeconds,
    rulesAcknowledged,
    setRulesAcknowledged,
    setPhase,
    loadForm,
    handleStart,
    onAnswerChange,
    handleSubmit,
    openConfirmStart,
  };
}
