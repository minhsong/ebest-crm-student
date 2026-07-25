/**
 * Request id xuyên suốt Portal BFF / SSR (header `X-Request-Id`).
 * Align CRM `RequestContext.requestId` khi relay error log.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const PORTAL_REQUEST_ID_HEADER = 'x-request-id';

type PortalRequestStore = {
  requestId: string;
};

const als = new AsyncLocalStorage<PortalRequestStore>();

export function createPortalRequestId(): string {
  return randomUUID();
}

/** Đọc từ header inbound hoặc tạo mới. */
export function resolvePortalRequestIdFromHeaders(
  headers?: Headers | HeadersInit | null,
): string {
  if (!headers) return createPortalRequestId();
  const h = headers instanceof Headers ? headers : new Headers(headers);
  const incoming =
    h.get('x-request-id')?.trim() ||
    h.get('X-Request-Id')?.trim() ||
    '';
  return incoming || createPortalRequestId();
}

export function getPortalRequestId(): string | undefined {
  return als.getStore()?.requestId;
}

export function requirePortalRequestId(): string {
  return getPortalRequestId() ?? createPortalRequestId();
}

/** Chạy callback trong ALS với requestId cố định. */
export function runWithPortalRequestId<T>(
  requestId: string,
  fn: () => T,
): T {
  return als.run({ requestId }, fn);
}

export async function runWithPortalRequestIdAsync<T>(
  requestId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return als.run({ requestId }, fn);
}

/** Header outbound → CRM / Gateway. */
export function portalRequestIdHeaders(
  requestId?: string,
): Record<string, string> {
  const id = requestId ?? getPortalRequestId() ?? createPortalRequestId();
  return { 'X-Request-Id': id };
}
