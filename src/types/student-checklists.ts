export type StudentChecklistListRow = {
  checklistId: number;
  classId: number;
  className: string;
  classCode: string;
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
  };
  studentItem: {
    id: number;
    classStudentId: number;
    checked: boolean;
    checkedAt: string | null;
    deadlineAt: string | null;
    note: string | null;
  };
};

