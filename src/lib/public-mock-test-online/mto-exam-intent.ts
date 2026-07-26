import { MOCK_TEST_ONLINE_LOCAL_RETENTION_MS } from './mock-test-online-intake-draft';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

/** Intent chọn đề trước auth — không phải SoT pending/registration (browse-first B). */
const EXAM_INTENT_KEY = 'mock-test-online:exam-intent:v1';

export type MtoExamIntent = {
  sessionId: number;
  testVariantChoice?: 'full' | 'mini';
};

type ExamIntentEnvelope = {
  savedAt: string;
  intent: MtoExamIntent;
};

function isBrowserStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function writeMtoExamIntent(intent: MtoExamIntent): void {
  if (!isBrowserStorage()) return;
  if (!Number.isFinite(intent.sessionId) || intent.sessionId < 1) return;
  try {
    const envelope: ExamIntentEnvelope = {
      savedAt: new Date().toISOString(),
      intent: {
        sessionId: Math.trunc(intent.sessionId),
        ...(intent.testVariantChoice === 'full' ||
        intent.testVariantChoice === 'mini'
          ? { testVariantChoice: intent.testVariantChoice }
          : {}),
      },
    };
    localStorage.setItem(EXAM_INTENT_KEY, JSON.stringify(envelope));
  } catch {
    // ignore quota
  }
}

export function readMtoExamIntent(): MtoExamIntent | null {
  if (!isBrowserStorage()) return null;
  try {
    const raw = localStorage.getItem(EXAM_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExamIntentEnvelope;
    const savedAt = Date.parse(parsed.savedAt);
    if (!Number.isFinite(savedAt)) return null;
    if (Date.now() - savedAt > MOCK_TEST_ONLINE_LOCAL_RETENTION_MS) {
      localStorage.removeItem(EXAM_INTENT_KEY);
      return null;
    }
    const sessionId = Number(parsed.intent?.sessionId);
    if (!Number.isFinite(sessionId) || sessionId < 1) return null;
    const variant = parsed.intent?.testVariantChoice;
    return {
      sessionId: Math.trunc(sessionId),
      ...(variant === 'full' || variant === 'mini'
        ? { testVariantChoice: variant }
        : {}),
    };
  } catch {
    return null;
  }
}

export function clearMtoExamIntent(): void {
  if (!isBrowserStorage()) return;
  try {
    localStorage.removeItem(EXAM_INTENT_KEY);
  } catch {
    // ignore
  }
}

/** Path select-exam mang intent — dùng làm returnUrl sau login/register. */
export function buildSelectExamIntentPath(intent: MtoExamIntent): string {
  const q = new URLSearchParams();
  q.set('sessionId', String(Math.trunc(intent.sessionId)));
  if (intent.testVariantChoice === 'full' || intent.testVariantChoice === 'mini') {
    q.set('variant', intent.testVariantChoice);
  }
  return `${PORTAL_MOCK_TEST_ROUTES.onlineSelect}?${q.toString()}`;
}

export function parseSelectExamIntentFromSearchParams(input: {
  sessionId?: string | null;
  campaign?: string | null;
  variant?: string | null;
}): MtoExamIntent | null {
  const raw = input.sessionId?.trim() || input.campaign?.trim() || '';
  const sessionId = Number.parseInt(raw, 10);
  if (!Number.isFinite(sessionId) || sessionId < 1) return null;
  const v = input.variant?.trim();
  return {
    sessionId,
    ...(v === 'full' || v === 'mini' ? { testVariantChoice: v } : {}),
  };
}
