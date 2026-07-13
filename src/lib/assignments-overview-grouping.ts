import type { OverviewClassSessions } from '@/types/overview-sessions';

export type AssignmentOverviewRow = {
  assignmentId: number;
  classId: number;
  title: string;
  exerciseType: string | null;
  resultStatus: number | null;
  scoreDisplay: string | null;
  deadline: string | null;
  testQuizFormPublicId: string | null;
  quizMaxAttempts: number | null;
  vocabularyDrillPromptType?: string | null;
  vocabularyDrillModeId?: string | null;
  sessionId: number;
  sessionTitle: string;
  scheduledDate: string;
};

export type SessionAssignmentGroup = {
  sessionId: number;
  sessionTitle: string;
  scheduledDate: string;
  assignments: AssignmentOverviewRow[];
};

export type ClassAssignmentGroup = {
  classId: number;
  className: string;
  classCode: string;
  canInteract: boolean;
  readOnlyReason: string | null;
  sessions: SessionAssignmentGroup[];
};

export type CourseAssignmentGroup = {
  courseName: string;
  classes: ClassAssignmentGroup[];
};

/**
 * Nhóm bài tập từ GET overview/sessions: Khóa → Lớp → Buổi (canonical §5.1).
 */
export function groupAssignmentsFromOverview(
  blocks: OverviewClassSessions[],
): CourseAssignmentGroup[] {
  const byCourse = new Map<string, CourseAssignmentGroup>();

  for (const block of blocks) {
    const courseName = (block.courseName ?? '').trim() || 'Khóa học';
    let course = byCourse.get(courseName);
    if (!course) {
      course = { courseName, classes: [] };
      byCourse.set(courseName, course);
    }

    let cls = course.classes.find((c) => c.classId === block.classId);
    if (!cls) {
      cls = {
        classId: block.classId,
        className: block.className,
        classCode: block.classCode,
        canInteract: block.canInteract !== false,
        readOnlyReason: block.readOnlyReason ?? null,
        sessions: [],
      };
      course.classes.push(cls);
    }

    for (const session of block.sessions ?? []) {
      const assignments: AssignmentOverviewRow[] = [];
      for (const a of session.assignments ?? []) {
        const id = a.assignmentId;
        if (!Number.isFinite(id)) continue;
        assignments.push({
          assignmentId: id,
          classId: block.classId,
          title: (a.title ?? '').trim() || 'Bài tập',
          exerciseType: a.exerciseType ?? null,
          resultStatus: a.resultStatus ?? null,
          scoreDisplay: a.scoreDisplay ?? null,
          deadline: a.deadline ?? null,
          testQuizFormPublicId: a.testQuizFormPublicId?.trim() || null,
          quizMaxAttempts:
            typeof a.quizMaxAttempts === 'number' ? a.quizMaxAttempts : null,
          vocabularyDrillPromptType: a.vocabularyDrillPromptType ?? null,
          vocabularyDrillModeId: a.vocabularyDrillModeId ?? null,
          sessionId: session.sessionId,
          sessionTitle: session.title ?? 'Buổi học',
          scheduledDate: session.scheduledDate,
        });
      }
      if (assignments.length === 0) continue;

      cls.sessions.push({
        sessionId: session.sessionId,
        sessionTitle: session.title ?? 'Buổi học',
        scheduledDate: session.scheduledDate,
        assignments: assignments.sort((x, y) => x.assignmentId - y.assignmentId),
      });
    }

    cls.sessions.sort((a, b) => {
      const da = a.scheduledDate ?? '';
      const db = b.scheduledDate ?? '';
      return db.localeCompare(da);
    });
  }

  return [...byCourse.values()]
    .map((c) => ({
      ...c,
      classes: c.classes
        .filter((cl) => cl.sessions.length > 0)
        .sort((a, b) => a.className.localeCompare(b.className, 'vi')),
    }))
    .filter((c) => c.classes.length > 0)
    .sort((a, b) => a.courseName.localeCompare(b.courseName, 'vi'));
}

export function filterAssignmentGroups(
  groups: CourseAssignmentGroup[],
  predicate: (row: AssignmentOverviewRow) => boolean,
): CourseAssignmentGroup[] {
  return groups
    .map((course) => ({
      ...course,
      classes: course.classes
        .map((cls) => ({
          ...cls,
          sessions: cls.sessions
            .map((session) => ({
              ...session,
              assignments: session.assignments.filter(predicate),
            }))
            .filter((session) => session.assignments.length > 0),
        }))
        .filter((cls) => cls.sessions.length > 0),
    }))
    .filter((course) => course.classes.length > 0);
}

export function filterVocabularyDrillAssignmentGroups(
  groups: CourseAssignmentGroup[],
): CourseAssignmentGroup[] {
  return filterAssignmentGroups(
    groups,
    (row) => row.exerciseType === 'vocabulary_drill',
  );
}
