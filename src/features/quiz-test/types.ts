export type QuizPublishedFormSummary = {
  formPublicId: string;
  crmFormId: number;
  name: string | null;
  catalogKey: string | null;
  /** Breadcrumb từ CRM khi đã sync runtime (ưu tiên hiển thị thay cho catalogKey). */
  catalogPath?: string | null;
  type: string | null;
  durationSeconds: number;
  publishedAt: string | null;
  updatedAt: string | null;
};

export type QuizListResponse = {
  items: QuizPublishedFormSummary[];
};

export type QuizFormItemPayload = {
  formItemId: number | string;
  order?: number;
  sourceQuestionId: number | null;
  sourceGroupId: number | null;
  optionOrder?: string[] | null;
  questionSnapshot: null | {
    id: number;
    code?: string | null;
    questionType?: string | null;
    content?: Record<string, unknown>;
    /** Gom tag cấp câu (CRM preview) để hiển thị meta đề học viên. */
    taxonomyRefs?: { tagKeys?: string[] } | Record<string, unknown> | null;
    /** Quiz Tag System mới - tags với full path */
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
  taxonomyRefs?: { tagKeys?: string[] } | Record<string, unknown> | null;
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
  formItemIds?: number[];
};

export type QuizPublishedFormPayload = {
  formPublicId: string;
  crmFormId: number;
  name?: string;
  catalogKey?: string;
  catalogPath?: string | null;
  type?: string;
  durationSeconds?: number;
  instructions?: string | null;
  items?: QuizFormItemPayload[];
  groupBundles?: QuizGroupBundlePayload[];
  /** CRM preview / gateway snapshot — partition UI (§11). */
  sections?: QuizFormSectionPayload[];
  blueprint?: Record<string, unknown>;
};

export type StartAttemptResponse = {
  attemptPublicId: string;
  formPublicId: string;
  expiresAt: string;
  durationSeconds: number;
  startedAt: string;
  resumed?: boolean;
  /** Lượt phát còn lại: key `section:<sectionId>` = min(repeat) trong phần; legacy có thể còn key formItemId. */
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
