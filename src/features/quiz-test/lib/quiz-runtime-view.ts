import type {
  QuizAttemptHistoryItem,
  QuizAttemptTimerSlice,
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

function deadlineMsFromAttempt(attempt: StartAttemptResponse): number | null {
  const fromDeadline =
    typeof attempt.deadlineAt === 'string' && attempt.deadlineAt.trim()
      ? new Date(attempt.deadlineAt).getTime()
      : NaN;
  if (Number.isFinite(fromDeadline)) return fromDeadline;

  const durationSec = Math.max(0, Math.floor(Number(attempt.durationSeconds ?? 0)));
  const startedMs = new Date(attempt.startedAt).getTime();
  if (!Number.isFinite(startedMs) || durationSec <= 0) return null;
  return startedMs + durationSec * 1000;
}

export function applyServerTimerSlice(
  attempt: StartAttemptResponse,
  timer: QuizAttemptTimerSlice | null | undefined,
): StartAttemptResponse {
  if (!timer || typeof timer !== 'object') return attempt;
  return {
    ...attempt,
    startedAt: timer.startedAt || attempt.startedAt,
    durationSeconds: timer.durationSeconds ?? attempt.durationSeconds,
    deadlineAt: timer.deadlineAt,
    expiresAt: timer.expiresAt ?? attempt.expiresAt,
    timer,
  };
}

export function remainingSecondsFromTimer(
  timer: QuizAttemptTimerSlice | null | undefined,
): number | null {
  if (!timer || typeof timer.remainingSeconds !== 'number') return null;
  if (!Number.isFinite(timer.remainingSeconds)) return null;
  return Math.max(0, Math.floor(timer.remainingSeconds));
}

export function getAttemptTimerValidity(
  attempt: StartAttemptResponse | null,
): AttemptTimerValid | AttemptTimerInvalid {
  if (!attempt) return { ok: false };
  const durationSec = Math.max(0, Math.floor(Number(attempt.durationSeconds ?? 0)));
  const deadlineMs = deadlineMsFromAttempt(attempt);
  if (deadlineMs == null || durationSec <= 0) return { ok: false };
  return { ok: true, deadlineMs, durationSec };
}

export function syncRemainingFromAttempt(attempt: StartAttemptResponse): number {
  const fromSlice = remainingSecondsFromTimer(attempt.timer);
  if (fromSlice != null) return fromSlice;

  const v = getAttemptTimerValidity(attempt);
  if (!v.ok) return REMAINING_UNSET;
  return Math.max(0, Math.ceil((v.deadlineMs - Date.now()) / 1000));
}

export function normalizeAttemptAnswers(payload: unknown): Record<string, string | string[]> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      out[k] = v.map(String);
      continue;
    }
    if (v && typeof v === 'object') {
      const row = v as Record<string, unknown>;
      if (Array.isArray(row.selectedOptionIds) && row.selectedOptionIds.length) {
        out[k] = row.selectedOptionIds.map(String);
        continue;
      }
      if (typeof row.textAnswer === 'string' && row.textAnswer.trim()) {
        out[k] = row.textAnswer.trim();
        continue;
      }
    }
    if (v != null && String(v) !== '') out[k] = String(v);
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

export function getStatusTagColor(status: string): 'green' | 'orange' | 'blue' | 'default' {
  if (status === 'submitted') return 'green';
  if (status === 'expired') return 'orange';
  if (status === 'voided') return 'default';
  return 'blue';
}

export function getStatusLabel(status: string): string {
  if (status === 'submitted') return 'Đã nộp bài';
  if (status === 'expired') return 'Hết giờ';
  if (status === 'voided') return 'Đã hủy';
  if (status === 'in_progress') return 'Đang làm';
  return status;
}

export function getAttemptHistoryRowLabel(status: string): string {
  if (status === 'submitted') return 'Đã nộp';
  if (status === 'expired') return 'Hết giờ';
  if (status === 'voided') return 'Đã hủy';
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
  const deadlineAt =
    typeof p.deadlineAt === 'string' ? p.deadlineAt.trim() : '';
  if (!attemptPublicId || !startedAt) return null;
  if (!deadlineAt && !expiresAt) return null;

  const timerRaw = p.timer;
  const timer =
    timerRaw &&
    typeof timerRaw === 'object' &&
    !Array.isArray(timerRaw) &&
    typeof (timerRaw as QuizAttemptTimerSlice).deadlineAt === 'string'
      ? (timerRaw as QuizAttemptTimerSlice)
      : undefined;

  return {
    attemptPublicId,
    formPublicId:
      typeof p.formPublicId === 'string' && p.formPublicId
        ? p.formPublicId
        : fallbackFormPublicId,
    durationSeconds: Math.max(0, Math.floor(Number(p.durationSeconds ?? 0))),
    startedAt,
    deadlineAt: deadlineAt || timer?.deadlineAt,
    expiresAt: expiresAt || timer?.expiresAt || deadlineAt,
    timer,
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

/** Extended grading info per form item for result display */
export type QuizGradingPerItem = {
  isCorrect: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
};

export function buildGradingPerItem(
  gradingItems: Array<{
    formItemId?: string | number;
    isCorrect?: boolean;
    selectedOptionIds?: string[];
    correctOptionIds?: string[];
  }> | null | undefined,
): Record<string, QuizGradingPerItem | undefined> {
  const map: Record<string, QuizGradingPerItem | undefined> = {};
  for (const row of Array.isArray(gradingItems) ? gradingItems : []) {
    const key = String(row?.formItemId ?? '').trim();
    if (!key) continue;
    const correctOptionIds = Array.isArray(row?.correctOptionIds)
      ? row.correctOptionIds.map(String).filter((id) => id.trim() !== '')
      : [];
    map[key] = {
      isCorrect: row?.isCorrect ?? false,
      selectedOptionIds: Array.isArray(row?.selectedOptionIds)
        ? row.selectedOptionIds.map(String)
        : [],
      correctOptionIds,
    };
  }
  return map;
}

export function getHistoryScoreText(
  row: QuizAttemptHistoryItem,
): string {
  const parsed = parseHistoryScore(row);
  if (!parsed) return '';
  const { correct, total, percent } = parsed;
  if (percent != null) {
    return ` · ${correct}/${total} (${percent}%)`;
  }
  return ` · Điểm: ${correct}/${total}`;
}

/** Điểm cho card lịch sử — correct/total + %. */
export function parseHistoryScore(
  row: QuizAttemptHistoryItem,
): { correct: number; total: number; percent: number | null } | null {
  const summary = row.gradingSummary;
  if (
    summary &&
    Number.isFinite(Number(summary.totalQuestions)) &&
    Number.isFinite(Number(summary.correctCount))
  ) {
    const total = Number(summary.totalQuestions);
    const correct = Number(summary.correctCount);
    const percent =
      total > 0
        ? Math.round((correct / total) * 100)
        : Number.isFinite(Number(summary.accuracy))
          ? Math.round(Number(summary.accuracy))
          : null;
    return { correct, total, percent };
  }

  const correctCount = Number(row.correctCount);
  const totalQuestions = Number(row.totalQuestions);
  if (Number.isFinite(correctCount) && Number.isFinite(totalQuestions) && totalQuestions > 0) {
    return {
      correct: correctCount,
      total: totalQuestions,
      percent: Math.round((correctCount / totalQuestions) * 100),
    };
  }

  return null;
}

export function historyScoreTagColor(percent: number | null): string {
  if (percent == null) return 'default';
  if (percent >= 80) return 'success';
  if (percent >= 50) return 'gold';
  return 'error';
}

