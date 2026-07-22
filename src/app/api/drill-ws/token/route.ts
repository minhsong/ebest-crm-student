import { NextResponse } from 'next/server';

import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';

export async function GET() {
  const token = getPortalAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }

  return NextResponse.json(
    { accessToken: token },
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        Pragma: 'no-cache',
      },
    },
  );
}
