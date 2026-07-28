import { NextResponse } from 'next/server';
import { runPortalOnlineBootstrap } from '@/features/portal-mock-test/server/run-portal-online-bootstrap.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

export const dynamic = 'force-dynamic';

/**
 * Bootstrap MTO online — POST JSON (thay Server Action để debug prod dễ hơn).
 * Response luôn JSON: `{ ok, redirectTo|error, traceId }`.
 * GET giữ redirect về trang start (bookmark cũ).
 */
export async function POST() {
  try {
    const result = await runPortalOnlineBootstrap();
    if (result.ok) {
      return NextResponse.json({
        ok: true,
        redirectTo: result.redirectTo,
        traceId: result.traceId,
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        traceId: result.traceId,
      },
      { status: 200 },
    );
  } catch (error) {
    // Không để Next trả 500 HTML opaque — luôn JSON.
    const message =
      error instanceof Error ? error.message : 'bootstrap_unhandled';
    console.error(
      JSON.stringify({
        event: 'portal.bootstrap.route_unhandled',
        message: message.slice(0, 500),
        stack: error instanceof Error ? error.stack?.slice(0, 2000) : undefined,
      }),
    );
    return NextResponse.json(
      {
        ok: false,
        error: 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.',
        traceId: null,
        debug: process.env.PORTAL_SSR_DEBUG === 'true' ? message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return NextResponse.redirect(
    new URL(PORTAL_MOCK_TEST_ROUTES.onlineStart, request.url),
  );
}
