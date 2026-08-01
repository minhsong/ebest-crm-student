import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PORTAL_PATHNAME_HEADER } from '@/lib/portal-auth/portal-pathname-header';

/**
 * Gắn pathname (+ search) vào request headers — auth-required SSR dùng làm returnUrl.
 * Không gate auth ở middleware (vẫn layout/BFF quyết định).
 */
export function middleware(request: NextRequest) {
	const requestHeaders = new Headers(request.headers);
	const pathWithSearch = `${request.nextUrl.pathname}${request.nextUrl.search}`;
	requestHeaders.set(PORTAL_PATHNAME_HEADER, pathWithSearch);
	return NextResponse.next({
		request: { headers: requestHeaders },
	});
}

export const config = {
	matcher: [
		/*
		 * Bỏ static assets / image optimizer.
		 * Giữ mọi page + Route Handler để layout auth đọc được pathname.
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
	],
};
