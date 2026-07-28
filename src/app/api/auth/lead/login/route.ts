import { proxyPortalAuthLoginPost } from '@/lib/portal-auth/portal-auth-login.server';

/**
 * @deprecated Alias — dùng `POST /api/auth/login` (password thống nhất).
 */
export async function POST(request: Request) {
  return proxyPortalAuthLoginPost(request);
}
