import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(request: NextRequest) {
	const classId = request.nextUrl.searchParams.get('classId');
	const scope = request.nextUrl.searchParams.get('scope');
	const period = request.nextUrl.searchParams.get('period');
	if (!classId || !scope || !period) {
		return Response.json(
			{ message: 'Thiếu tham số classId, scope hoặc period.' },
			{ status: 400 },
		);
	}
	const qs = new URLSearchParams({ classId, scope, period }).toString();
	return proxyStudentCrmGet(request, `learning/leaderboards?${qs}`);
}
