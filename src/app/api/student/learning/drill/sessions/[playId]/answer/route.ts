import { NextRequest } from 'next/server';

import { proxyStudentCrmRequest } from '@/lib/student-crm-proxy';

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ playId: string }> },
) {
	const { playId } = await context.params;
	const body = await request.json().catch(() => ({}));
	return proxyStudentCrmRequest(
		request,
		`learning/drill/sessions/${playId}/answer`,
		{
			method: 'POST',
			jsonBody: body,
		},
	);
}
