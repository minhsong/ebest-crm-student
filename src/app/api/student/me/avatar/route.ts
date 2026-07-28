import type { NextRequest } from 'next/server';
import { handleStudentMeAvatarUpload } from '@/lib/bff/student-me-avatar.server';

/** Customer avatar upload — canonical BFF path. */
export async function POST(request: NextRequest) {
  return handleStudentMeAvatarUpload(request);
}
