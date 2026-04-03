import type { OverviewSessionRow } from '@/types/overview-sessions';
import { CRM_CLASS_SESSION_STATUS } from '@/lib/crm-enums';

/** So sánh theo giờ bắt đầu buổi (local browser). */
export function sessionStartTimestamp(
  row: Pick<OverviewSessionRow, 'scheduledDate' | 'scheduledStartTime'>,
): number {
  const d = row.scheduledDate.slice(0, 10);
  const t = normalizeTimeString(row.scheduledStartTime);
  return new Date(`${d}T${t}`).getTime();
}

/** So sánh theo giờ kết thúc buổi (local browser). */
export function sessionEndTimestamp(
  row: Pick<OverviewSessionRow, 'scheduledDate' | 'scheduledEndTime'>,
): number {
  const d = row.scheduledDate.slice(0, 10);
  const t = normalizeTimeString(row.scheduledEndTime);
  return new Date(`${d}T${t}`).getTime();
}

function normalizeTimeString(t: string): string {
  const p = String(t).split(':');
  const h = (p[0] ?? '0').padStart(2, '0');
  const m = (p[1] ?? '0').padStart(2, '0');
  const rawSec = p[2] ?? '00';
  const s = rawSec.replace(/\D/g, '').slice(0, 2) || '00';
  return `${h}:${m}:${s.padStart(2, '0')}`;
}

/** Bỏ qua buổi đã hủy — chỉ giữ buổi planned (sắp diễn ra) và đã/đang diễn ra theo thời gian. */
export function includeSessionInStudentSchedule(
  row: OverviewSessionRow,
): boolean {
  return row.sessionStatus !== CRM_CLASS_SESSION_STATUS.CANCELLED;
}

/**
 * Buổi chưa kết thúc (theo giờ kết thúc) lên đầu — sắp xếp theo thời gian bắt đầu tăng dần;
 * buổi đã kết thúc phía sau — mới nhất trước.
 */
export function orderSessionsPlannedFirst(
  rows: OverviewSessionRow[],
): OverviewSessionRow[] {
  const now = Date.now();
  const planned: OverviewSessionRow[] = [];
  const past: OverviewSessionRow[] = [];
  for (const r of rows) {
    if (sessionEndTimestamp(r) >= now) planned.push(r);
    else past.push(r);
  }
  planned.sort((a, b) => sessionStartTimestamp(a) - sessionStartTimestamp(b));
  past.sort((a, b) => sessionEndTimestamp(b) - sessionEndTimestamp(a));
  return [...planned, ...past];
}
