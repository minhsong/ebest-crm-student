import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import type { SubmitAttemptResponse } from '@/features/quiz-test/types';

export const DEADLINE_SERVER_POLL_INTERVAL_MS = 2000;
export const DEADLINE_REST_SUBMIT_FALLBACK_MS = 8000;
export const DEADLINE_SERVER_POLL_MAX_MS = 30000;

export function buildQuizAttemptResultHref(
  formPublicId: string,
  attemptPublicId: string,
): string {
  return `/quiz-test/${encodeURIComponent(formPublicId)}/attempts/${encodeURIComponent(attemptPublicId)}`;
}

export type AttemptChannelStatus = 'in_progress' | 'submitted' | 'expired' | 'unknown';

export async function fetchAttemptChannelStatus(
  attemptPublicId: string,
): Promise<{
  status: AttemptChannelStatus;
  snapshot: Record<string, unknown> | null;
}> {
  const url = quizRuntimePublicUrl(`attempts/${attemptPublicId.trim()}`);
  const { ok, data } = await fetchQuizRuntimeJson<Record<string, unknown>>(url);
  if (!ok || !data || typeof data !== 'object') {
    return { status: 'unknown', snapshot: null };
  }
  const raw = String(data.status ?? '').toLowerCase();
  if (raw === 'submitted' || raw === 'expired' || raw === 'in_progress') {
    return { status: raw, snapshot: data };
  }
  return { status: 'unknown', snapshot: data };
}

export function isQuizAttemptMutationBlockedResponse(
  status: number,
  data: unknown,
): boolean {
  if (status !== 409 && status !== 403 && status !== 400) return false;
  const msg =
    data && typeof data === 'object' && 'message' in data
      ? String((data as { message: unknown }).message)
      : '';
  return /deadline|not in progress|expired|hết giờ/i.test(msg);
}

export function parseAttemptClosedWsPayload(
  payload: unknown,
  expectedAttemptId: string,
): {
  submitted: SubmitAttemptResponse;
  reason: 'deadline_auto_submit' | 'submitted' | 'unknown';
  message: string | null;
} | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (String(p.attemptPublicId ?? '').trim() !== expectedAttemptId.trim()) {
    return null;
  }
  const submitted = p.submitted;
  if (!submitted || typeof submitted !== 'object') return null;
  const s = submitted as Record<string, unknown>;
  if (s.ok !== true) return null;
  const reasonRaw = String(p.reason ?? '');
  const reason =
    reasonRaw === 'deadline_auto_submit'
      ? 'deadline_auto_submit'
      : reasonRaw === 'submitted'
        ? 'submitted'
        : 'unknown';
  return {
    submitted: submitted as SubmitAttemptResponse,
    reason,
    message: typeof p.message === 'string' ? p.message : null,
  };
}

export function submitResponseFromAttemptSnapshot(
  snapshot: Record<string, unknown>,
): SubmitAttemptResponse | null {
  const id = String(snapshot.attemptPublicId ?? '').trim();
  if (!id) return null;
  const status = String(snapshot.status ?? 'submitted');
  return {
    ok: true,
    attemptPublicId: id,
    status,
    submittedAt:
      typeof snapshot.submittedAt === 'string' ? snapshot.submittedAt : null,
    answersByFormItemId:
      snapshot.answersByFormItemId &&
      typeof snapshot.answersByFormItemId === 'object'
        ? (snapshot.answersByFormItemId as Record<string, unknown>)
        : undefined,
    grading:
      snapshot.grading && typeof snapshot.grading === 'object'
        ? (snapshot.grading as SubmitAttemptResponse['grading'])
        : null,
  };
}

/**
 * Chờ server chuyển sang submitted/expired (scheduler + WS).
 */
export async function pollAttemptUntilTerminal(
  attemptPublicId: string,
  options?: { maxMs?: number; intervalMs?: number },
): Promise<{
  status: 'submitted' | 'expired';
  snapshot: Record<string, unknown>;
} | null> {
  const maxMs = options?.maxMs ?? DEADLINE_SERVER_POLL_MAX_MS;
  const intervalMs = options?.intervalMs ?? DEADLINE_SERVER_POLL_INTERVAL_MS;
  const started = Date.now();

  while (Date.now() - started < maxMs) {
    const { status, snapshot } = await fetchAttemptChannelStatus(attemptPublicId);
    if (status === 'submitted' || status === 'expired') {
      return { status, snapshot: snapshot ?? {} };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
