import { NextResponse } from 'next/server';

import {
  logInternalApiError,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';

export type SocialGatewayConfig = {
  baseUrl: string;
  serviceToken: string;
};

export function getSocialGatewayConfig(): SocialGatewayConfig | null {
  const baseUrl = process.env.SOCIAL_GATEWAY_BASE_URL?.replace(/\/$/, '') ?? '';
  const serviceToken = process.env.SOCIAL_GATEWAY_SERVICE_TOKEN?.trim() ?? '';
  if (!baseUrl || !serviceToken) return null;
  return { baseUrl, serviceToken };
}

export function buildGatewayServiceHeaders(
  cfg: SocialGatewayConfig,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.serviceToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function proxyGatewayJsonResponse(
  upstream: Response,
  fallbackMessage = STUDENT_SAFE_USER_MESSAGES.generic,
): Promise<NextResponse> {
  const data = await upstream.json().catch(() => ({}));
  if (upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }
  return NextResponse.json(
    mapPortalConflictForClient(data, upstream.status, fallbackMessage),
    { status: upstream.status },
  );
}

export function gatewayConfigErrorResponse(logTag: string): NextResponse {
  logInternalApiError(logTag, 'missing gateway config');
  return NextResponse.json(
    { message: STUDENT_SAFE_USER_MESSAGES.serverConfig },
    { status: 503 },
  );
}

export function gatewayUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { message: STUDENT_SAFE_USER_MESSAGES.unauthorized },
    { status: 401 },
  );
}
