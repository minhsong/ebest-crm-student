export type LeadProfile = {
  id: number;
  displayName: string | null;
  email: string;
  phoneE164: string | null;
  emailVerifiedAt: string | null;
  omniLeadId: string;
  /** false = đăng ký cơ bản, chưa được vào layout đầy đủ */
  profileCompleted: boolean;
  /** Manual MTO account chưa có password; complete-profile phải thu thập. */
  passwordSetupRequired?: boolean;
  profileCompletedAt?: string | null;
  /** Có Google identity đã liên kết; không chứa Google subject. */
  googleLinked?: boolean;
  identityUpgrade?: {
    available?: boolean;
    applied?: boolean;
    reLoginRequired?: boolean;
    customerId?: number;
    reason?: string;
  };
};

export type LeadTestTrackingPhase =
  | 'registered'
  | 'confirmed'
  | 'in_progress'
  | 'grading'
  | 'done';

export type LeadTestResultSummary = {
  registrationId: number;
  sessionId: number;
  sessionTitle: string | null;
  status: string;
  deliveryMode: 'online' | 'offline' | null;
  trackingPhase: LeadTestTrackingPhase | null;
  statusLabel: string | null;
  displayName: string | null;
  registeredAt: string;
  scoredAt: string | null;
  examUnlockExpiresAt?: string | null;
  quizAttemptId?: string | null;
  resultView?: {
    profileCode: string;
    profileVersion: string;
    total: {
      value: number;
      max: number;
      label: string;
      display: string;
    };
    skills: Array<{
      code: string;
      label: string;
      value: number;
      max: number;
      display: string;
    }>;
    details: Array<{
      code: string;
      label: string;
      rawCorrect?: number;
      totalQuestions?: number;
      accuracy?: number;
    }>;
  } | null;
  scores: {
    listening: string;
    reading: string;
    total: string;
  } | null;
};

/** Probe phiên portal — `customer` thay cho legacy `student`. */
export type LeadSessionProbe =
  | { kind: 'none' }
  | { kind: 'lead' }
  | { kind: 'customer' };
