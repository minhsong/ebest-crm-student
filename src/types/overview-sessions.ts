/**
 * Khớp payload GET /api/v1/student/overview/sessions (sau unwrap).
 */

export interface OverviewSessionRow {
  sessionId: number;
  sessionStatus: number;
  sessionStatusLabel: string;
  /** Buổi kèm/học bổ trợ (CRM `class_sessions.is_tutoring_session`). */
  isTutoringSession: boolean;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  title: string;
  teacherDisplayName: string | null;
  /** Hex — màu Tag GV (CRM), null khi chưa gán GV */
  teacherTagColor: string | null;
  assistantTeacherDisplayNames: string[];
  assistantTeachers: Array<{ displayName: string; tagColor: string }>;
  classroomName: string | null;
  /** Hex — màu Tag phòng theo cơ sở (CRM), null khi chưa gán phòng */
  classroomTagColor: string | null;
  attendanceStatus: number | null;
  attendanceLabel: string | null;
  assignments: Array<{
    assignmentId: number;
    title: string;
    /** ExerciseType (crm-api) — e.g. 'recording', 'writing', ... */
    exerciseType?: string | null;
    resultStatus: number | null;
    scoreDisplay: string | null;
  }>;
}

export interface OverviewClassSessions {
  classId: number;
  className: string;
  classCode: string;
  courseName: string;
  /** ClassStatus CRM: 2=READY, 3=IN_PROGRESS, … */
  classStatus: number;
  classStatusLabel: string;
  /** Giáo viên chủ nhiệm (CRM) */
  homeroomTeacherDisplayName?: string | null;
  /** Giáo vụ / người hỗ trợ lớp */
  supportStaffDisplayNames?: string[];
  sessions: OverviewSessionRow[];
}
