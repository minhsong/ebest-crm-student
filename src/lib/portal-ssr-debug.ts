/**
 * Log SSR Portal → CRM (stdout process Next).
 * Bật: PORTAL_SSR_DEBUG=true (hoặc MOCK_TEST_ONLINE_DEBUG=true).
 * Không log Bearer / JWT / body đầy đủ.
 */

export function isPortalSsrDebugEnabled(): boolean {
  return (
    process.env.PORTAL_SSR_DEBUG === 'true' ||
    process.env.MOCK_TEST_ONLINE_DEBUG === 'true'
  );
}

function maskPhone(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const t = value.trim();
  if (t.length <= 4) return '****';
  return `…${t.slice(-4)}`;
}

/** Tóm tắt payload CRM portal/session an toàn cho log. */
export function summarizePortalSessionCrmPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const actor = typeof payload.actor === 'string' ? payload.actor : null;
  const accountId = payload.accountId ?? null;
  const customer =
    payload.customer && typeof payload.customer === 'object'
      ? (payload.customer as Record<string, unknown>)
      : null;
  const leadAccount =
    payload.leadAccount && typeof payload.leadAccount === 'object'
      ? (payload.leadAccount as Record<string, unknown>)
      : null;

  return {
    actor,
    accountId,
    keys: Object.keys(payload).slice(0, 24),
    customerId: customer?.id ?? null,
    customerOmniLeadId:
      typeof customer?.omniLeadId === 'string' ? customer.omniLeadId : null,
    customerPhoneMasked: maskPhone(customer?.primaryPhone),
    leadOmniLeadId:
      typeof leadAccount?.omniLeadId === 'string'
        ? leadAccount.omniLeadId
        : typeof payload.omniLeadId === 'string'
          ? payload.omniLeadId
          : null,
    leadPhoneMasked: maskPhone(
      leadAccount?.phoneE164 ?? leadAccount?.phone ?? payload.phoneE164,
    ),
    identityUpgradeAvailable: Boolean(
      (payload.identityUpgrade as { available?: boolean } | undefined)
        ?.available,
    ),
  };
}

export function logPortalSsr(
  event: string,
  details?: Record<string, unknown>,
): void {
  if (!isPortalSsrDebugEnabled()) return;
  const line = JSON.stringify({
    event: `portal.ssr.${event}`,
    ts: new Date().toISOString(),
    pid: process.pid,
    ...details,
  });
  console.info(line);
}

/** Luôn log lỗi SSR quan trọng (kể cả khi tắt debug) — không kèm secret. */
export function logPortalSsrError(
  event: string,
  error: unknown,
  details?: Record<string, unknown>,
): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'unknown';
  const line = JSON.stringify({
    event: `portal.ssr.${event}`,
    ts: new Date().toISOString(),
    pid: process.pid,
    message: message.slice(0, 500),
    name: error instanceof Error ? error.name : undefined,
    stack:
      error instanceof Error && process.env.NODE_ENV !== 'production'
        ? error.stack?.slice(0, 2000)
        : undefined,
    ...details,
  });
  console.error(line);
}
