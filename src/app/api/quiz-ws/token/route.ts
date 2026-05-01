import { NextResponse } from 'next/server';

import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

/**
 * Chỉ dùng cho handshake Socket.IO tới gateway: trả Bearer từ cookie httpOnly.
 * Không cache; tránh nhét JWT vào JS thường xuyên — dài hạn nên đổi sang ticket WS ngắn hạn.
 */
export async function GET() {
  const token = getStudentAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
