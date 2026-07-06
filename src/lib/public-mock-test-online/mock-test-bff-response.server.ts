/**
 * SSOT map mock-test BFF → client-safe payload (M7-8, PI-D16).
 */

import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';
import type { PortalConflictClientPayload } from '@/lib/portal-conflict-client';

function isInternalLeadEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@mto.ebest.internal');
}

/** Lỗi CRM / Gateway mock-test → client. */
export function mapMockTestBffErrorForClient(
  data: unknown,
  status: number,
  fallback: string,
): PortalConflictClientPayload {
  return mapPortalConflictForClient(data, status, fallback);
}

/** Success provision-lead-session — bỏ omniLeadId + email nội bộ. */
export function mapProvisionLeadSessionForClient(payload: unknown): {
  account: {
    id: number;
    displayName: string | null;
    email: string;
    phoneE164: string;
    provisioned: boolean;
  } | null;
  provisioned: boolean;
} {
  const raw =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};
  const accountRaw =
    raw.account && typeof raw.account === 'object'
      ? (raw.account as Record<string, unknown>)
      : null;

  if (!accountRaw) {
    return { account: null, provisioned: false };
  }

  let email = String(accountRaw.email ?? '');
  if (isInternalLeadEmail(email)) {
    email = '';
  }

  return {
    account: {
      id: Number(accountRaw.id ?? 0),
      displayName:
        typeof accountRaw.displayName === 'string'
          ? accountRaw.displayName
          : null,
      email,
      phoneE164: String(accountRaw.phoneE164 ?? ''),
      provisioned: accountRaw.provisioned === true,
    },
    provisioned: Boolean(raw.accessToken),
  };
}
