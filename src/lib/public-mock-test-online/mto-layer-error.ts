/**
 * Nguyên tắc lỗi MTO (Portal):
 * 1. Mỗi layer/module **log** lỗi của chính nó kèm `requestId` + `module` + `operation`.
 * 2. Intermediate layer **rethrow** để layer trên xử lý (không nuốt).
 * 3. Terminal BFF (Route Handler) mới map → JSON an toàn cho browser (SP-SEC).
 *
 * Align: ERROR_LOG_CRM_IMPLEMENTATION · SP-SEC-5 · FLOW_DECOMPOSITION layers.
 */
import { logInternalApiError } from '@/lib/student-safe-errors';
import {
  createPortalRequestId,
  getPortalRequestId,
  portalRequestIdHeaders,
} from '@/lib/portal-request-context';

export type MtoErrorLayer =
  | 'bff'
  | 'ssr'
  | 'proxy-crm'
  | 'proxy-gw'
  | 'client'
  | 'boundary';

export type MtoErrorModule =
  | 'mto-funnel'
  | 'mto-exam-capability'
  | 'mto-ownership'
  | 'mto-hub'
  | 'mto-quiz'
  | 'mto-identity'
  | 'mto-bff'
  | 'mto-ssr'
  | string;

const LOGGED_LAYERS = Symbol.for('ebest.mto.loggedLayers');

type ErrorWithLogged = Error & {
  [LOGGED_LAYERS]?: Set<string>;
  requestId?: string;
};

export type MtoLayerErrorMeta = {
  /** Khối logic — vd. mto-funnel */
  module: MtoErrorModule;
  /** Thao tác cụ thể — vd. provision-lead-session */
  operation: string;
  layer: MtoErrorLayer;
  path?: string;
  method?: string;
  requestId?: string;
  errorType?: string;
  extra?: Record<string, unknown>;
};

function layerKey(meta: MtoLayerErrorMeta): string {
  return `${meta.layer}:${meta.module}:${meta.operation}`;
}

function attachLogged(error: unknown, key: string, requestId: string): void {
  if (!(error instanceof Error)) return;
  const e = error as ErrorWithLogged;
  if (!e[LOGGED_LAYERS]) e[LOGGED_LAYERS] = new Set();
  e[LOGGED_LAYERS].add(key);
  if (!e.requestId) e.requestId = requestId;
}

function alreadyLogged(error: unknown, key: string): boolean {
  if (!(error instanceof Error)) return false;
  return Boolean((error as ErrorWithLogged)[LOGGED_LAYERS]?.has(key));
}

/**
 * Log lỗi cho **đúng** module/layer hiện tại (kèm requestId).
 * Không throw — caller quyết định rethrow hoặc terminal respond.
 * Tránh double-log cùng một layerKey trên cùng Error instance.
 */
export function logMtoLayerError(
  error: unknown,
  meta: MtoLayerErrorMeta,
): string {
  const requestId =
    meta.requestId?.trim() ||
    getPortalRequestId() ||
    (error instanceof Error && (error as ErrorWithLogged).requestId) ||
    createPortalRequestId();

  const key = layerKey(meta);
  if (alreadyLogged(error, key)) {
    return requestId;
  }

  const context = `mto.${meta.layer}.${meta.module}.${meta.operation}`;
  logInternalApiError(context, error, {
    path: meta.path,
    method: meta.method,
    errorType: meta.errorType ?? `MTO_${meta.layer.toUpperCase()}_ERROR`,
    requestId,
    details: {
      service: 'student-portal',
      layer: meta.layer,
      module: meta.module,
      operation: meta.operation,
      requestId,
      ...meta.extra,
    },
  });

  attachLogged(error, key, requestId);
  return requestId;
}

/**
 * Intermediate: log module hiện tại rồi **rethrow** nguyên error
 * để layer / step tiếp theo bắt và xử lý chính xác.
 */
export function logAndRethrowMtoError(
  error: unknown,
  meta: MtoLayerErrorMeta,
): never {
  logMtoLayerError(error, meta);
  throw error;
}

/** Header X-Request-Id gắn outbound (CRM/GW). */
export function mtoOutboundRequestHeaders(
  requestId?: string,
): Record<string, string> {
  return portalRequestIdHeaders(requestId ?? getPortalRequestId());
}
