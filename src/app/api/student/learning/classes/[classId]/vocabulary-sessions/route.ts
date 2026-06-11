import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ classId: string }> },
) {
	const { classId } = await context.params;
	return proxyStudentCrmGet(
		request,
		`learning/classes/${classId}/vocabulary-sessions`,
	);
}
