import type { OverviewClassSessions } from '@/types/overview-sessions';

export type StudentClassDetailTabKey =
  | 'sessions'
  | 'assignments'
  | 'checklists'
  | 'attendance';

export type StudentClassAssignmentsRow = {
  assignmentId: number;
  title: string;
  sessionTitle: string;
  scheduledDate: string;
  resultStatus: number | null;
  scoreDisplay: string | null;
};

export function classDetailTitleFromOverview(
  classId: number,
  overview: OverviewClassSessions | null,
): string {
  if (overview?.className?.trim()) {
    return `${overview.className} (${overview.classCode || '—'})`;
  }
  return `Lớp #${classId}`;
}

