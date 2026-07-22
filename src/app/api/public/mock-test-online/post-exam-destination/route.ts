import { NextResponse } from 'next/server';
import { resolvePostExamDestination } from '@/features/portal-mock-test/server/resolve-post-exam-destination.server';

/** Actor/profile được CRM verify; BFF chỉ trả internal destination đã sanitize. */
export async function GET() {
  const destination = await resolvePostExamDestination();
  return NextResponse.json(destination);
}
