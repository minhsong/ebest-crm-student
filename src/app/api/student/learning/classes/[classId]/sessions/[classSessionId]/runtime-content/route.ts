import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

/** Knowledge Base M2 — nội dung bài học buổi (published only). */
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ classId: string; classSessionId: string }> },
) {
	const { classId, classSessionId } = await context.params;
	return proxyStudentCrmGet(
		request,
		`learning/classes/${classId}/sessions/${classSessionId}/runtime-content`,
	);
}
