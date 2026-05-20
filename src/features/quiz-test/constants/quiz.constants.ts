/**
 * Quiz Constants
 * Centralized constants for quiz-related operations
 */

// ============================================================================
// Quiz Phases (State Machine)
// ============================================================================

export const QUIZ_PHASES = {
  LOADING_FORM: 'loading_form',
  READY: 'ready',
  CONFIRM_START: 'confirm_start',
  STARTING: 'starting',
  ATTEMPTING: 'attempting',
  SUBMITTING: 'submitting',
  DONE: 'done',
  ERROR: 'error',
} as const;

export type QuizPhase = typeof QUIZ_PHASES[keyof typeof QUIZ_PHASES];

// ============================================================================
// Quiz Attempt States
// ============================================================================

export const QUIZ_ATTEMPT_STATES = {
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
} as const;

export type QuizAttemptState = typeof QUIZ_ATTEMPT_STATES[keyof typeof QUIZ_ATTEMPT_STATES];

// ============================================================================
// Quiz Attempt Status
// ============================================================================

export const QUIZ_ATTEMPT_STATUS = {
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
  IN_PROGRESS: 'in_progress',
} as const;

export type QuizAttemptStatus = typeof QUIZ_ATTEMPT_STATUS[keyof typeof QUIZ_ATTEMPT_STATUS];

// ============================================================================
// Quiz Status Labels (Vietnamese)
// ============================================================================

export const QUIZ_STATUS_LABELS: Record<QuizAttemptStatus, string> = {
  [QUIZ_ATTEMPT_STATUS.SUBMITTED]: 'Đã nộp bài',
  [QUIZ_ATTEMPT_STATUS.EXPIRED]: 'Hết giờ',
  [QUIZ_ATTEMPT_STATUS.IN_PROGRESS]: 'Đang làm',
};

// ============================================================================
// Quiz Status Colors (Ant Design)
// ============================================================================

export const QUIZ_STATUS_COLORS: Record<QuizAttemptStatus, 'green' | 'orange' | 'blue'> = {
  [QUIZ_ATTEMPT_STATUS.SUBMITTED]: 'green',
  [QUIZ_ATTEMPT_STATUS.EXPIRED]: 'orange',
  [QUIZ_ATTEMPT_STATUS.IN_PROGRESS]: 'blue',
};

// ============================================================================
// Quiz WebSocket Events
// ============================================================================

export const QUIZ_WS_EVENTS = {
  PATCH_ANSWERS: 'quiz.answers.patch',
  ANSWERS_SYNC: 'quiz.answers.sync',
  LISTENING_STATE_SYNC: 'quiz.listening.state.sync',
  JOIN: 'quiz.attempt.join',
  JOINED: 'quiz.attempt.joined',
  ERROR: 'error',
} as const;

// ============================================================================
// Quiz Timer
// ============================================================================

export const QUIZ_TIMER = {
  REMAINING_UNSET: -1,
  TICK_INTERVAL_MS: 1000,
} as const;

// ============================================================================
// Quiz UI Messages
// ============================================================================

export const QUIZ_UI_MESSAGES = {
  // Timer messages
  TIMER_EXPIRED: 'Hết giờ làm bài. Hệ thống đang tự động nộp bài.',
  TIMER_EXPIRED_NOTIFICATION: 'Đã hết giờ, hệ thống tự động nộp bài.',
  AUTO_SUBMIT_TRIGGERED: 'Hết giờ làm bài. Hệ thống đang tự động nộp bài.',

  // Error messages
  LOAD_FORM_FAILED: 'Không tải được đề.',
  START_FAILED: 'Không tạo phiên làm bài được.',
  SUBMIT_FAILED: 'Nộp bài thất bại',
  SAVE_DRAFT_FAILED: 'Không lưu nháp được — kiểm tra mạng hoặc phiên làm bài đã hết hạn.',
  NO_ATTEMPT: 'Không tìm thấy phiên làm bài hợp lệ để nộp.',

  // Status messages
  ALREADY_CLOSED_EXPIRED: 'Bài làm đã đóng do hết thời gian.',
  ALREADY_CLOSED_SUBMITTED: 'Bài làm đã được nộp trước đó.',

  // Sync messages
  SYNC_SCORE_FAILED: 'Đồng bộ điểm sang bài tập thất bại. Vui lòng thử lại.',
  SYNC_NETWORK_ERROR: 'Lỗi kết nối khi đồng bộ điểm.',
} as const;

// ============================================================================
// Quiz API Endpoints
// ============================================================================

export const QUIZ_API = {
  FORMS: 'forms',
  ATTEMPTS: 'attempts',
  PROGRESS: 'progress',
  ACTIVE_ATTEMPT: 'active-attempt',
  ANSWERS: 'answers',
  LISTENING_CYCLE: 'listening-cycle',
  SUBMIT: 'submit',
  RESULT_LAYOUT: 'result-layout',
} as const;

// ============================================================================
// Quiz Validation
// ============================================================================

export const QUIZ_VALIDATION = {
  MIN_ASSIGNMENT_ID: 1,
  MAX_REMAINING_SECONDS: 86400, // 24 hours
  DEFAULT_HISTORY_LIMIT: 100,
} as const;

// ============================================================================
// Quiz History
// ============================================================================

export const QUIZ_HISTORY = {
  LABELS: {
    SUBMITTED: 'Đã nộp',
    EXPIRED: 'Hết giờ',
    IN_PROGRESS: 'Đang làm',
  },
} as const;
