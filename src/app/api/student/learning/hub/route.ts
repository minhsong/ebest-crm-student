import { NextRequest } from 'next/server';

import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';

export async function GET(request: NextRequest) {
	return proxyStudentCrmGet(request, 'learning/hub');
}
