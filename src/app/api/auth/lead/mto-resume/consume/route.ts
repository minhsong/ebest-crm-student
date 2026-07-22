import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';
import {
  applyPortalAccessTokenCookie,
  readAccessTokenFromCrmPayload,
} from '@/lib/portal-auth/apply-portal-auth-success.server';
import { applyMockTestOnlineFunnelSessionCookie } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import {
  buildGatewayServiceHeaders,
  getSocialGatewayConfig,
} from '@/lib/social-gateway-bff.util';

type LeadSessionPayload = {
  kind?: 'lead_session';
  accessToken?: string;
  account?: {
    id: number;
    displayName: string | null;
    email: string;
    phoneE164: string | null;
    profileCompleted: boolean;
    passwordSetupRequired: boolean;
  };
  nextPath?: string;
};

type OmniFunnelPayload = {
  kind: 'omni_funnel';
  omniLeadId: string;
  email: string;
  entryMode: 'retake_zalo' | 'google_fast';
};

async function bootstrapOmniFunnel(input: {
  omniLeadId: string;
  entryMode: 'retake_zalo' | 'google_fast';
}): Promise<
  | { ok: true; funnelSessionId: string; resumeStep: 'select' | 'verify' }
  | { ok: false; message: string }
> {
  const cfg = getSocialGatewayConfig();
  if (!cfg) {
    return { ok: false, message: 'Cấu hình gateway chưa đúng.' };
  }
  const url = `${cfg.baseUrl}/api/v1/internal/mock-test-online/leads/${encodeURIComponent(input.omniLeadId)}/bootstrap-lead-pending`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...buildGatewayServiceHeaders(cfg),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entryMode: input.entryMode }),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as {
    pendingLeadId?: string;
    funnelSessionId?: string;
    resumeStep?: 'select' | 'verify';
    message?: string;
  };
  const funnelSessionId = (
    data.funnelSessionId ??
    data.pendingLeadId ??
    ''
  ).trim();
  if (!res.ok || !funnelSessionId) {
    return {
      ok: false,
      message:
        typeof data.message === 'string' && data.message.trim()
          ? data.message
          : 'Không khôi phục được phiên đăng ký. Vui lòng thử lại.',
    };
  }
  return {
    ok: true,
    funnelSessionId,
    resumeStep: data.resumeStep === 'verify' ? 'verify' : 'select',
  };
}

/** Public — đổi token resume → cookie portal_at hoặc funnel MTO. */
export async function POST(request: Request) {
  const body = await request.json();
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.authLeadMtoResumeConsume);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof data?.message === 'string' ? { message: data.message } : data,
      { status: res.status },
    );
  }

  const payload = unwrapCrmResponseBody(data) as
    | LeadSessionPayload
    | OmniFunnelPayload;

  if (payload && (payload as OmniFunnelPayload).kind === 'omni_funnel') {
    const omni = payload as OmniFunnelPayload;
    const boot = await bootstrapOmniFunnel({
      omniLeadId: omni.omniLeadId,
      entryMode: omni.entryMode,
    });
    if (!boot.ok) {
      return NextResponse.json({ message: boot.message }, { status: 502 });
    }
    const nextPath =
      boot.resumeStep === 'verify'
        ? '/mock-test-online/confirm-exam'
        : '/mock-test-online/select-exam';
    const response = NextResponse.json({
      kind: 'omni_funnel' as const,
      nextPath,
    });
    applyMockTestOnlineFunnelSessionCookie(response, boot.funnelSessionId);
    return response;
  }

  const leadPayload = payload as LeadSessionPayload;
  const token = readAccessTokenFromCrmPayload(leadPayload);
  if (!token) {
    return NextResponse.json(
      { message: 'Phản hồi thiếu phiên đăng nhập.' },
      { status: 502 },
    );
  }

  applyPortalAccessTokenCookie('lead', token);

  return NextResponse.json({
    kind: 'lead_session' as const,
    actor: 'lead' as const,
    account: leadPayload.account ?? null,
    nextPath:
      typeof leadPayload.nextPath === 'string' && leadPayload.nextPath.trim()
        ? leadPayload.nextPath
        : '/mock-test',
  });
}
