import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

/**
 * @deprecated Endpoint GET không còn side-effect — mutation bootstrap đã chuyển
 * sang Server Action `startPortalOnlineBootstrapAction` (POST-only).
 * Giữ lại để tương thích link/bookmark cũ: redirect về trang start.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL(PORTAL_MOCK_TEST_ROUTES.onlineStart, request.url),
  );
}
