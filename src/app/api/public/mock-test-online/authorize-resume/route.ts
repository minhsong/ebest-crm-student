import { NextRequest } from 'next/server';

import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { proxyMockTestOnlineAuthorizePost } from '@/lib/public-mock-test-online/gateway-public-proxy';
import { fetchCustomerOnlineBootstrapContextSsr } from '@/features/portal-mock-test/server/fetch-customer-bootstrap-context.server';
import { buildAuthorizeResumeBody } from '@/features/portal-mock-test/server/authorize-resume-body.server';



export async function POST(req: NextRequest) {

	const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

	const session = await resolvePortalSessionFromCookies();

	let omniLeadId: string | undefined;
	if (session.actor === 'lead') {
		omniLeadId = session.omniLeadId;
	} else if (session.actor === 'customer') {
		const context = await fetchCustomerOnlineBootstrapContextSsr();
		if (context?.customerId === session.customer.id) {
			omniLeadId = context.omniLeadId;
		}
	}

	const enriched = buildAuthorizeResumeBody(body, omniLeadId);

	return proxyMockTestOnlineAuthorizePost(req, 'authorize-resume', enriched);

}

