import { headers } from 'next/headers';
import { PORTAL_PATHNAME_HEADER } from '@/lib/portal-auth/portal-pathname-header';
import { sanitizePortalReturnUrl } from '@/lib/portal-auth/post-auth-return-url';

export { PORTAL_PATHNAME_HEADER };

/** Đường dẫn hiện tại cho returnUrl sau login (SSR layout). */
export async function getPortalRequestPathname(
	fallback: string = '/',
): Promise<string> {
	const h = await headers();
	const raw = h.get(PORTAL_PATHNAME_HEADER);
	return sanitizePortalReturnUrl(raw) ?? fallback;
}
