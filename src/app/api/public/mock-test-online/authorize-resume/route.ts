import { NextRequest } from 'next/server';
import { proxyMockTestOnlineAuthorizePost } from '@/lib/public-mock-test-online/gateway-public-proxy';
import { buildAuthorizeResumeBody } from '@/features/portal-mock-test/server/authorize-resume-body.server';
import { resolveMtoCallerIdentityFromCookies } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';

export async function POST(req: NextRequest) {
	const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
	const resolved = await resolveMtoCallerIdentityFromCookies();
	const omniLeadId =
		resolved.ok ? resolved.identity.omniLeadId : undefined;
	const enriched = buildAuthorizeResumeBody(body, omniLeadId);
	return proxyMockTestOnlineAuthorizePost(req, 'authorize-resume', enriched);
}
