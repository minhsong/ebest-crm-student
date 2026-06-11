import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ assignmentId: string }> },
) {
	const { assignmentId } = await context.params;
	return proxyStudentCrmGet(
		request,
		`learning/drill/assignments/${assignmentId}/context`,
	);
}
