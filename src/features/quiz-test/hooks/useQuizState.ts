/**
 * Quiz State Hook
 * Manages quiz form loading and attempt state machine
 */

import { useCallback, useState } from 'react';
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
  normalizeAttemptAnswers,
  toValidAttemptPayload,
  syncRemainingFromAttempt,
  REMAINING_UNSET,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import { mergeAttemptWithFormPublishedDuration } from '@/features/quiz-test/lib/quiz-attempt-merge';

export type QuizAttemptPhase =
  | 'loading_form'
  | 'ready'
  | 'confirm_start'
  | 'starting'
  | 'attempting'
  | 'submitting'
  | 'done'
  | 'error';

interface UseQuizStateOptions {
  formPublicId: string;
  assignmentId?: number;
}

interface UseQuizStateReturn {
  phase: QuizAttemptPhase;
  errMsg: string | null;
  formPayload: QuizPublishedFormPayload | null;
  attempt: StartAttemptResponse | null;
  answers: Record<string, string | string[]>;
  submitResult: SubmitAttemptResponse | null;
  attemptHistory: QuizAttemptHistoryItem[];
  listeningRemaining: Record<string, number>;
  // Actions
  loadForm: () => Promise<void>;
  startAttempt: (mergedAttempt: StartAttemptResponse, rawAttempt: unknown) => void;
  setAnswers: (answers: Record<string, string | string[]>) => void;
  setListeningRemaining: (remaining: Record<string, number>) => void;
  setSubmitResult: (result: SubmitAttemptResponse | null) => void;
  setPhase: (phase: QuizAttemptPhase) => void;
  setErrMsg: (msg: string | null) => void;
  setAttemptHistory: (history: QuizAttemptHistoryItem[]) => void;
}

/**
 * Hook to manage quiz form and attempt state
 */
export function useQuizState(options: UseQuizStateOptions): UseQuizStateReturn {
  const { formPublicId, assignmentId } = options;

  const [phase, setPhase] = useState<QuizAttemptPhase>('loading_form');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [formPayload, setFormPayload] = useState<QuizPublishedFormPayload | null>(null);
  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitResult, setSubmitResult] = useState<SubmitAttemptResponse | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistoryItem[]>([]);
  const [listeningRemaining, setListeningRemaining] = useState<Record<string, number>>({});

  const loadForm = useCallback(async () => {
    setPhase('loading_form');
    setErrMsg(null);

    const url = quizRuntimePublicUrl(`forms/${formPublicId}`);

    try {
      // Fetch form and active attempt in parallel
      const [formRes, activeRes, historyRes] = await Promise.all([
        fetchQuizRuntimeJson<QuizPublishedFormPayload & { message?: string }>(url),
        fetchQuizRuntimeJson<QuizAttemptStateResponse>(
          quizRuntimePublicUrl(`forms/${formPublicId}/active-attempt`),
        ),
        fetchQuizRuntimeJson<{ items?: QuizAttemptHistoryItem[] }>(
          quizRuntimePublicUrl(`forms/${formPublicId}/attempts`),
        ),
      ]);

      // Check form fetch
      if (!formRes.ok) {
        const msg =
          typeof formRes.data?.message === 'string'
            ? formRes.data.message
            : `HTTP ${formRes.status}`;
        throw new Error(msg);
      }
      setFormPayload(formRes.data);

      // Set history
      const nextHistory = Array.isArray(historyRes.data?.items)
        ? historyRes.data.items
        : [];
      setAttemptHistory(nextHistory);

      // Check active attempt state
      if (activeRes.ok && activeRes.data && typeof activeRes.data === 'object') {
        const state = activeRes.data as QuizAttemptStateResponse;

        if (state.state === 'in_progress') {
          const rawAttempt = state.attempt;
          const resumed = toValidAttemptPayload(rawAttempt, formPublicId);
          if (resumed) {
            const merged = mergeAttemptWithFormPublishedDuration(resumed, formRes.data);
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
            setPhase('attempting');
            return;
          }
        }

        if (state.state === 'closed') {
          const attemptId = String(state.attempt?.attemptPublicId ?? '');
          setAttempt(null);
          setAnswers({});
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
      setListeningRemaining({});
      setPhase('ready');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Không tải được đề.');
      setPhase('error');
    }
  }, [formPublicId]);

  const startAttempt = useCallback(
    (mergedAttempt: StartAttemptResponse, rawAttempt: unknown) => {
      setAttempt(mergedAttempt);
      setListeningRemaining(
        normalizeListeningMap(
          (rawAttempt as { remainingPlaysByListeningUnit?: unknown })
            ?.remainingPlaysByListeningUnit,
        ),
      );
      if (!mergedAttempt.resumed) {
        setAnswers({});
      }
      setPhase('attempting');
    },
    [],
  );

  return {
    phase,
    errMsg,
    formPayload,
    attempt,
    answers,
    submitResult,
    attemptHistory,
    listeningRemaining,
    loadForm,
    startAttempt,
    setAnswers,
    setListeningRemaining,
    setSubmitResult,
    setPhase,
    setErrMsg,
    setAttemptHistory,
  };
}

/**
 * Normalize listening map
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
