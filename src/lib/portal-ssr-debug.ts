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

function maskOmniLeadId(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const t = value.trim();
  if (t.length <= 6) return '****';
  return `…${t.slice(-6)}`;
}

/** Tóm tắt attempt-status CRM — phục vụ debug bootstrap / select-exam. */
export function summarizeAttemptStatus(
  status: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!status || typeof status !== 'object') return null;
  const sessionCap =
    status.sessionCap && typeof status.sessionCap === 'object'
      ? (status.sessionCap as Record<string, unknown>)
      : null;
  const activeInExam =
    status.activeInExam && typeof status.activeInExam === 'object'
      ? (status.activeInExam as Record<string, unknown>)
      : null;
  const activeReady =
    status.activeReady && typeof status.activeReady === 'object'
      ? (status.activeReady as Record<string, unknown>)
      : null;

  return {
    omniLeadIdMasked: maskOmniLeadId(status.omniLeadId),
    testTypeCode: status.testTypeCode ?? null,
    verifiedCount: status.verifiedCount ?? null,
    maxAttempts: status.maxAttempts ?? null,
    remaining: status.remaining ?? null,
    globalRemaining: status.globalRemaining ?? null,
    attemptMode: status.attemptMode ?? null,
    entitlementMode: status.entitlementMode ?? null,
    sessionCap: sessionCap
      ? {
          sessionId: sessionCap.sessionId ?? null,
          sessionRemaining: sessionCap.sessionRemaining ?? null,
          verifiedOnSession: sessionCap.verifiedOnSession ?? null,
          maxAttemptsPerPhone: sessionCap.maxAttemptsPerPhone ?? null,
        }
      : null,
    activeInExam: activeInExam
      ? {
          registrationId: activeInExam.registrationId ?? null,
          sessionId: activeInExam.sessionId ?? null,
          resumeAllowed: activeInExam.resumeAllowed ?? null,
        }
      : null,
    activeReady: activeReady
      ? {
          registrationId: activeReady.registrationId ?? null,
          sessionId: activeReady.sessionId ?? null,
          resumeAllowed: activeReady.resumeAllowed ?? null,
        }
      : null,
  };
}

/** Principal MTO — không log PII đầy đủ. */
export function summarizeBootstrapPrincipal(
  principal: Record<string, unknown>,
): Record<string, unknown> {
  const actor = typeof principal.actor === 'string' ? principal.actor : null;
  return {
    actor,
    customerId: principal.customerId ?? null,
    omniLeadIdMasked: maskOmniLeadId(principal.omniLeadId),
    phoneMasked: maskPhone(principal.phoneE164),
    profileCompleted: principal.profileCompleted ?? null,
    leadAccountId: principal.leadAccountId ?? null,
  };
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
    stack: error instanceof Error ? error.stack?.slice(0, 2000) : undefined,
    ...details,
  });
  console.error(line);
}

/**
 * Log quyết định bootstrap MTO — luôn ghi stdout (prod-safe, không secret).
 * Dùng traceId correlate với CRM system-errors.
 */
export function logPortalBootstrap(
  event: string,
  details?: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    event: `portal.bootstrap.${event}`,
    ts: new Date().toISOString(),
    pid: process.pid,
    ...details,
  });
  console.info(line);
}

/**
 * Log gọi upstream (CRM/GW) — luôn stdout.
 * Dùng để trả lời: API nào fail, status/body gì.
 */
export function logPortalUpstream(
  event: string,
  details: {
    method?: string;
    url?: string | null;
    path?: string;
    status?: number;
    ok?: boolean;
    durationMs?: number;
    errorMessage?: string | null;
    bodyPreview?: string | null;
    traceId?: string;
    [key: string]: unknown;
  },
): void {
  const line = JSON.stringify({
    event: `portal.upstream.${event}`,
    ts: new Date().toISOString(),
    pid: process.pid,
    ...details,
    bodyPreview:
      typeof details.bodyPreview === 'string'
        ? details.bodyPreview.slice(0, 800)
        : details.bodyPreview,
  });
  console.info(line);
}
