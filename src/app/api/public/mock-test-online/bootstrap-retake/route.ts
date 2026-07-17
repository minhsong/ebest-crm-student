import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

/** @deprecated — dùng trang `/mock-test/online/start` (Server Action bootstrap). */
export async function GET(request: NextRequest) {
  const target = new URL(PORTAL_MOCK_TEST_ROUTES.onlineStart, request.url);
  return NextResponse.redirect(target);
}
