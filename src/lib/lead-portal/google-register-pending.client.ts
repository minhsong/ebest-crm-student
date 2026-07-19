'use client';

import { sanitizePortalReturnUrl } from '@/lib/portal-auth/post-auth-return-url';

const STORAGE_KEY = 'ebest:portal:google-register-pending:v1';

export type PendingGoogleRegistration = {
  ticket: string;
  email: string;
  displayName?: string;
  /** Safe returnUrl sau finalize/session — giữ qua F5. */
  returnUrl?: string;
};

export function storePendingGoogleRegistration(
  input: PendingGoogleRegistration,
): void {
  if (typeof sessionStorage === 'undefined') return;
  const safeReturnUrl = sanitizePortalReturnUrl(input.returnUrl);
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ticket: input.ticket,
      email: input.email,
      ...(typeof input.displayName === 'string' && input.displayName
        ? { displayName: input.displayName }
        : {}),
      ...(safeReturnUrl ? { returnUrl: safeReturnUrl } : {}),
    }),
  );
}

/** Giữ đến khi finalize thành công để F5 không làm mất ticket còn hạn. */
export function readPendingGoogleRegistration(): PendingGoogleRegistration | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingGoogleRegistration>;
    if (
      typeof parsed.ticket !== 'string' ||
      !parsed.ticket ||
      typeof parsed.email !== 'string' ||
      !parsed.email
    ) {
      return null;
    }
    const safeReturnUrl = sanitizePortalReturnUrl(parsed.returnUrl);
    return {
      ticket: parsed.ticket,
      email: parsed.email,
      ...(typeof parsed.displayName === 'string' && parsed.displayName
        ? { displayName: parsed.displayName }
        : {}),
      ...(safeReturnUrl ? { returnUrl: safeReturnUrl } : {}),
    };
  } catch {
    return null;
  }
}

export function clearPendingGoogleRegistration(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
