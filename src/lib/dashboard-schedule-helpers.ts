import type {
  OverviewClassSessions,
  OverviewSessionRow,
} from '@/types/overview-sessions';
import {
  includeSessionInStudentSchedule,
  sessionEndTimestamp,
  sessionStartTimestamp,
} from '@/lib/session-schedule';

export type SessionWithClassMeta = {
  row: OverviewSessionRow;
  classId: number;
  className: string;
  classCode: string;
};

export function flattenSessionsWithClass(
  blocks: OverviewClassSessions[],
): SessionWithClassMeta[] {
  const out: SessionWithClassMeta[] = [];
  for (const b of blocks) {
    for (const row of b.sessions ?? []) {
      if (!includeSessionInStudentSchedule(row)) continue;
      out.push({
        row,
        classId: b.classId,
        className: b.className,
        classCode: b.classCode,
      });
    }
  }
  return out;
}

/** Thứ Hai là ngày đầu tuần (giống lịch dạy CRM). */
export function startOfWeekMonday(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function toYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 7 ngày từ Thứ Hai; key `YYYY-MM-DD` → buổi trong ngày (đã sort theo giờ bắt đầu). */
export function groupSessionsByWeekDay(
  flat: SessionWithClassMeta[],
  weekStartMonday: Date,
): Map<string, SessionWithClassMeta[]> {
  const map = new Map<string, SessionWithClassMeta[]>();
  for (let i = 0; i < 7; i++) {
    map.set(toYyyyMmDd(addDays(weekStartMonday, i)), []);
  }
  const startStr = toYyyyMmDd(weekStartMonday);
  const endExclusive = toYyyyMmDd(addDays(weekStartMonday, 7));
  for (const item of flat) {
    const ds = item.row.scheduledDate.slice(0, 10);
    if (ds >= startStr && ds < endExclusive) {
      map.get(ds)?.push(item);
    }
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) => sessionStartTimestamp(a.row) - sessionStartTimestamp(b.row),
    );
  }
  return map;
}

export function recentPastSessions(
  flat: SessionWithClassMeta[],
  limit: number,
): SessionWithClassMeta[] {
  const now = Date.now();
  return flat
    .filter((x) => sessionEndTimestamp(x.row) < now)
    .sort(
      (a, b) =>
        sessionEndTimestamp(b.row) - sessionEndTimestamp(a.row),
    )
    .slice(0, limit);
}

export function countPastSessions(flat: SessionWithClassMeta[]): number {
  const now = Date.now();
  return flat.filter((x) => sessionEndTimestamp(x.row) < now).length;
}
