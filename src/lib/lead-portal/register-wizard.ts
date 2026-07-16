/** Wizard đăng ký lead — bước giống complete-profile / contact mock-test. */

export type LeadRegisterWizardStep = 1 | 2;

export const LEAD_REGISTER_STEP_TITLES: Record<LeadRegisterWizardStep, string> = {
  1: 'Thông tin liên hệ',
  2: 'Đặt mật khẩu',
};

export const LEAD_REGISTER_STEP_1_FIELDS = [
  'displayName',
  'phone',
  'email',
] as const;

export const LEAD_REGISTER_STEP_1_FIELDS_PROOF = ['phone', 'email'] as const;

export const LEAD_REGISTER_STEP_2_FIELDS = [
  'password',
  'confirmPassword',
] as const;

const DRAFT_KEY = 'ebest.leadRegister.draft.v1';

export type LeadRegisterDraft = {
  displayName?: string;
  phone?: string;
  email?: string;
  updatedAt: number;
};

export function loadLeadRegisterDraft(): LeadRegisterDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LeadRegisterDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLeadRegisterDraft(
  partial: Omit<LeadRegisterDraft, 'updatedAt'>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const next: LeadRegisterDraft = {
      ...partial,
      updatedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export function clearLeadRegisterDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
