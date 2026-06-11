import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(request: NextRequest) {
	const classId = request.nextUrl.searchParams.get('classId');
	if (!classId) {
		return Response.json({ message: 'Thiếu tham số classId.' }, { status: 400 });
	}
	const limit = request.nextUrl.searchParams.get('limit');
	const qs = new URLSearchParams({ classId });
	if (limit) {
		qs.set('limit', limit);
	}
	return proxyStudentCrmGet(request, `learning/analytics/weak-words?${qs.toString()}`);
}
