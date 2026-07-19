export type GoogleSessionCredential = {
  actor: 'lead' | 'customer';
  accessToken: string;
};

/** Fail-closed: session thiếu actor/token hợp lệ không được set cookie. */
export function extractGoogleSessionCredential(
  payload: Record<string, unknown>,
): GoogleSessionCredential | null {
  if (payload.flow !== 'session') return null;
  const actor =
    payload.actor === 'lead' || payload.actor === 'customer'
      ? payload.actor
      : null;
  const accessToken =
    typeof payload.accessToken === 'string' ? payload.accessToken.trim() : '';
  return actor && accessToken ? { actor, accessToken } : null;
}

/**
 * Allowlist response Google register/finalize cho browser.
 * Không trả accessToken, google_sub, omniLeadId, leadAccountId, customerId.
 */
export function allowlistGoogleRegisterClientPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const flow = typeof payload.flow === 'string' ? payload.flow : '';
  const out: Record<string, unknown> = { flow };

  if (flow === 'session') {
    const actor =
      payload.actor === 'customer' || payload.actor === 'lead'
        ? payload.actor
        : null;
    if (actor) out.actor = actor;
    if (typeof payload.expiresIn === 'string')
      out.expiresIn = payload.expiresIn;
    const account = payload.account;
    if (account && typeof account === 'object' && !Array.isArray(account)) {
      const a = account as Record<string, unknown>;
      out.account = {
        displayName:
          typeof a.displayName === 'string' || a.displayName === null
            ? a.displayName
            : null,
        email: typeof a.email === 'string' ? a.email : undefined,
        phoneE164:
          typeof a.phoneE164 === 'string' || a.phoneE164 === null
            ? a.phoneE164
            : undefined,
        emailVerifiedAt:
          typeof a.emailVerifiedAt === 'string' || a.emailVerifiedAt === null
            ? a.emailVerifiedAt
            : null,
        profileCompleted: a.profileCompleted === true,
      };
    }
    return out;
  }

  if (flow === 'register_ticket') {
    if (typeof payload.ticket === 'string') out.ticket = payload.ticket;
    const prefill = payload.prefill;
    if (prefill && typeof prefill === 'object' && !Array.isArray(prefill)) {
      const p = prefill as Record<string, unknown>;
      out.prefill = {
        email: typeof p.email === 'string' ? p.email : '',
        ...(typeof p.displayName === 'string'
          ? { displayName: p.displayName }
          : {}),
      };
    }
    return out;
  }

  if (flow === 'password_link') {
    if (payload.actor === 'customer' || payload.actor === 'lead') {
      out.actor = payload.actor;
    }
    if (typeof payload.ticket === 'string') out.ticket = payload.ticket;
    if (typeof payload.message === 'string') out.message = payload.message;
    return out;
  }

  if (flow === 'complete_profile') {
    out.actor = 'customer';
    if (typeof payload.completeProfileUrl === 'string') {
      out.completeProfileUrl = payload.completeProfileUrl;
    }
    if (
      payload.reason === 'needs_password' ||
      payload.reason === 'incomplete_profile'
    ) {
      out.reason = payload.reason;
    }
    return out;
  }

  if (flow === 'conflict') {
    if (typeof payload.code === 'string') out.code = payload.code;
    if (typeof payload.message === 'string') out.message = payload.message;
    if (payload.action === 'login' || payload.action === 'use_other_email') {
      out.action = payload.action;
    }
    return out;
  }

  return out;
}
