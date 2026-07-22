/** Các route portal công khai — không cần phiên học viên CRM. */
export function isPublicAnonymousPortalPath(pathname: string): boolean {
	return (
		pathname.startsWith('/mock-test-online') ||
		pathname.startsWith('/mock-test-register') ||
		pathname.startsWith('/lead/register') ||
		pathname.startsWith('/lead/login') ||
		pathname.startsWith('/lead/resume') ||
		pathname === '/login' ||
		pathname.startsWith('/forgot-password') ||
		pathname.startsWith('/reset-password')
	);
}
