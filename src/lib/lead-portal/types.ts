export type LeadProfile = {
  id: number;
  displayName: string | null;
  email: string;
  phoneE164: string;
  emailVerifiedAt: string | null;
  omniLeadId: string;
  identityUpgrade?: {
    available?: boolean;
    applied?: boolean;
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
  scores: {
    listening: string;
    reading: string;
    total: string;
  } | null;
};

export type LeadSessionProbe =
  | { kind: 'none' }
  | { kind: 'lead' }
  | { kind: 'student' };
