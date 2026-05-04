import type {
  QuizAttemptHistoryItem,
  StartAttemptResponse,
} from '@/features/quiz-test/types';
import type { QuizRenderableBlock } from '@/features/quiz-test/lib/quiz-renderable-items';

export const REMAINING_UNSET = -1;

export type AttemptTimerValid = {
  ok: true;
  deadlineMs: number;
  durationSec: number;
};

export type AttemptTimerInvalid = { ok: false };

export function formatCountdownHhMmSs(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '--:--:--';
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600)
    .toString()
    .padStart(2, '0');
  const mm = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function getAttemptTimerValidity(
  attempt: StartAttemptResponse | null,
): AttemptTimerValid | AttemptTimerInvalid {
  if (!attempt) return { ok: false };
  const durationSec = Math.max(0, Math.floor(Number(attempt.durationSeconds ?? 0)));
  const startedMs = new Date(attempt.startedAt).getTime();
  if (!Number.isFinite(startedMs) || durationSec <= 0) return { ok: false };
  return { ok: true, deadlineMs: startedMs + durationSec * 1000, durationSec };
}

export function syncRemainingFromAttempt(attempt: StartAttemptResponse): number {
  const v = getAttemptTimerValidity(attempt);
  if (!v.ok) return REMAINING_UNSET;
  return Math.max(0, Math.ceil((v.deadlineMs - Date.now()) / 1000));
}

export function normalizeAttemptAnswers(payload: unknown): Record<string, string | string[]> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (Array.isArray(v)) out[k] = v.map(String);
    else if (v != null) out[k] = String(v);
  }
  return out;
}

export function toViDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleString('vi-VN');
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} phút`;
  return `${m} phút ${s} giây`;
}

export function getStatusTagColor(status: string): 'green' | 'orange' | 'blue' {
  if (status === 'submitted') return 'green';
  if (status === 'expired') return 'orange';
  return 'blue';
}

export function getStatusLabel(status: string): string {
  if (status === 'submitted') return 'Đã nộp bài';
  if (status === 'expired') return 'Hết giờ';
  if (status === 'in_progress') return 'Đang làm';
  return status;
}

export function getAttemptHistoryRowLabel(status: string): string {
  if (status === 'submitted') return 'Đã nộp';
  if (status === 'expired') return 'Hết giờ';
  return 'Đang làm';
}

/** Đủ để `getScoreSummary` (GET attempt có thể trả summary thưa hơn submit). */
export type QuizGradingScoreInput =
  | {
      summary?: {
        totalQuestions?: number;
        correctCount?: number;
      } | null;
      items?: unknown;
    }
  | null
  | undefined;

export function getScoreSummary(
  grading: QuizGradingScoreInput,
): { total: number; correct: number } | null {
  const summary = grading?.summary;
  if (
    !summary ||
    !Number.isFinite(Number(summary.totalQuestions)) ||
    !Number.isFinite(Number(summary.correctCount))
  ) {
    return null;
  }
  return {
    total: Number(summary.totalQuestions),
    correct: Number(summary.correctCount),
  };
}

export function toValidAttemptPayload(
  payload: unknown,
  fallbackFormPublicId: string,
): StartAttemptResponse | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const p = payload as Record<string, unknown>;
  const attemptPublicId =
    typeof p.attemptPublicId === 'string' ? p.attemptPublicId.trim() : '';
  const startedAt =
    typeof p.startedAt === 'string' ? p.startedAt.trim() : '';
  const expiresAt =
    typeof p.expiresAt === 'string' ? p.expiresAt.trim() : '';
  if (!attemptPublicId || !startedAt || !expiresAt) return null;
  return {
    attemptPublicId,
    formPublicId:
      typeof p.formPublicId === 'string' && p.formPublicId
        ? p.formPublicId
        : fallbackFormPublicId,
    durationSeconds: Math.max(0, Math.floor(Number(p.durationSeconds ?? 0))),
    startedAt,
    expiresAt,
    resumed: true,
  };
}

export function buildBlockStartIndexes(renderBlocks: QuizRenderableBlock[]): number[] {
  let cursor = 0;
  return renderBlocks.map((b) => {
    const start = cursor;
    cursor += b.kind === 'single' ? 1 : b.items.length;
    return start;
  });
}

export function buildCorrectByFormItemId(
  gradingItems: Array<{ formItemId?: string | number; isCorrect?: boolean }> | null | undefined,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const row of Array.isArray(gradingItems) ? gradingItems : []) {
    const key = String(row?.formItemId ?? '').trim();
    if (!key || typeof row?.isCorrect !== 'boolean') continue;
    map[key] = row.isCorrect;
  }
  return map;
}

export function getHistoryScoreText(
  row: QuizAttemptHistoryItem,
): string {
  const summary = row.gradingSummary;
  if (
    !summary ||
    !Number.isFinite(Number(summary.totalQuestions)) ||
    !Number.isFinite(Number(summary.correctCount))
  ) {
    return '';
  }
  return ` · Điểm: ${Number(summary.correctCount)}/${Number(summary.totalQuestions)}`;
}

