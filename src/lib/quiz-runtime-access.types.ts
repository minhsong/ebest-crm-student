/** Ngữ cảnh truy cập quiz runtime — assignment hoặc ôn luyện. */
export type QuizRuntimeAccess = {
  mode: 'assignment' | 'practice';
  assignmentId?: number;
  practiceMode: boolean;
  /** Từ CRM authorize hoặc snapshot attempt — stats Gateway. */
  effectiveMaxAttempts?: number | null;
};
