export type QuizPublishedFormSummary = {
  formPublicId: string;
  crmFormId: number;
  name: string | null;
  tagCodes: string[];
  tagCategories: string[];
  type: string | null;
  durationSeconds: number;
  publishedAt: string | null;
  updatedAt: string | null;
};

export type QuizFormItemPayload = {
  formItemId: number | string;
  order?: number;
  /** Postgres section PK — có trên examSnapshot.layout.items sau startAttempt. */
  sectionId?: number;
  sectionOrderNo?: number | null;
  sourceQuestionId: number | null;
  sourceGroupId: number | null;
  optionOrder?: string[] | null;
  questionSnapshot: null | {
    id: number;
    code?: string | null;
    questionType?: string | null;
    content?: Record<string, unknown>;
    /** Tags câu (Quiz Tag System). */
    tags?: Array<{
      id: number;
      code?: string;
      name?: string;
      path?: string;
      pathNames?: string[];
    }>;
  };
};

export type QuizBundleChildPayload = {
  id: number;
  code?: string | null;
  questionType?: string | null;
  content?: Record<string, unknown>;
};

export type QuizGroupBundlePayload = {
  sourceGroupId: number;
  bundleSnapshot?: {
    content?: Record<string, unknown>;
  } | null;
  children?: QuizBundleChildPayload[];
};

export type QuizFormSectionPayload = {
  sectionId: number;
  order: number;
  title?: string | null;
  instructions?: string | null;
  formItemIds?: number[];
};

export type QuizPublishedFormPayload = {
  formPublicId: string;
  crmFormId: number;
  name?: string;
  type?: string;
  tagCodes?: string[];
  tagCategories?: string[];
  durationSeconds?: number;
  instructions?: string | null;
  items?: QuizFormItemPayload[];
  groupBundles?: QuizGroupBundlePayload[];
  /** CRM preview / gateway snapshot — partition UI (§11). */
  sections?: QuizFormSectionPayload[];
  blueprint?: Record<string, unknown>;
};

/** Đồng bộ từ Gateway WS/API — SSOT countdown. */
export type QuizAttemptTimerSlice = {
  serverNow: string;
  startedAt: string;
  durationSeconds: number;
  deadlineAt: string;
  expiresAt: string | null;
  remainingSeconds: number;
};

export type StartAttemptResponse = {
  attemptPublicId: string;
  formPublicId: string;
  /** Hạn làm bài (auto-submit server). */
  deadlineAt?: string;
  expiresAt: string;
  durationSeconds: number;
  startedAt: string;
  resumed?: boolean;
  timer?: QuizAttemptTimerSlice;
  /** Lượt phát còn lại: key `section:<sectionId>`. */
  remainingPlaysByListeningUnit?: Record<string, number>;
};

export type QuizAttemptProgressItem = {
  formPublicId: string;
  attemptPublicId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  remainingSeconds: number;
};

export type QuizAttemptStateResponse =
  | { state: 'none' }
  | {
      state: 'in_progress';
      attempt: StartAttemptResponse & {
        status?: string;
        answersByFormItemId?: Record<string, unknown>;
      };
    }
  | {
      state: 'closed';
      reason: 'expired' | 'submitted';
      attempt: {
        attemptPublicId: string;
        formPublicId?: string;
        status: string;
        startedAt?: string;
        expiresAt?: string;
        submittedAt?: string | null;
        answersByFormItemId?: Record<string, unknown>;
        grading?: SubmitAttemptResponse['grading'];
      };
    };

export type QuizAttemptHistoryItem = {
  attemptPublicId: string;
  formPublicId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  remainingSeconds: number;
  /** Gắn bài tập CRM khi start attempt có participantSnapshot.assignmentId */
  assignmentId?: number | null;
  /** Score from listAttempts response (fallback) */
  score?: number | null;
  scoreDisplay?: string | null;
  correctCount?: number | null;
  totalQuestions?: number | null;
  /** Detailed grading summary from detailed attempt response */
  gradingSummary?: {
    totalQuestions: number;
    gradedQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    gradedAt: string;
  } | null;
};

/** Một dòng trong danh sách Quiz — bài tập QUIZ gắn đề (trang tổng hợp). */
export type QuizAssignmentListItem = {
  assignmentId: number;
  assignmentTitle: string;
  formPublicId: string;
  scoreDisplay: string | null;
  resultStatus: number | null;
  deadline: string | null;
  sessionTitle: string | null;
  quizMaxAttempts: number | null;
};

export type SubmitAttemptResponse = {
  ok: true;
  attemptPublicId: string;
  status: string;
  submittedAt: string | null;
  answersByFormItemId?: Record<string, unknown>;
  grading?: {
    summary?: {
      totalQuestions: number;
      gradedQuestions: number;
      correctCount: number;
      wrongCount: number;
      accuracy: number;
      gradedAt: string;
    };
    items?: Array<{
      formItemId: string;
      isCorrect: boolean;
      selectedOptionIds: string[];
      correctOptionIds: string[];
    }>;
  } | null;
  idempotent?: true;
};
