export type StudentChecklistListRow = {
  checklistId: number;
  classId: number;
  className: string;
  classCode: string;
  classSessionTitle: string | null;
  typeKey: string;
  title: string;
  note: string | null;
  requiresSession: boolean;
  classSessionId: number | null;
  createdAt: string;
  checked: boolean;
  checkedAt: string | null;
  deadlineAt: string | null;
  studentNote: string | null;
};

export type StudentChecklistDetail = {
  checklist: {
    id: number;
    classId: number;
    typeKey: string;
    title: string;
    note: string | null;
    requiresSession: boolean;
    classSessionId: number | null;
    createdAt: string;
    gameConfig?: Record<string, unknown> | null;
  };
  studentItem: {
    id: number;
    classStudentId: number;
    checked: boolean;
    checkedAt: string | null;
    deadlineAt: string | null;
    note: string | null;
    bestScore?: number;
    playCount?: number;
    lastPlayAt?: string | null;
    completedVia?: string | null;
  };
  gameProgress?: {
    minimumScore: number;
    bestScore: number;
    playCount: number;
  } | null;
};
