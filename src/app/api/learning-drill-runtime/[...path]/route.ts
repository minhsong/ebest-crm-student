import { NextRequest, NextResponse } from 'next/server';

import { proxyDrillRuntimeToGateway } from '@/lib/learning-drill-gateway-proxy';
import {
  isUpstreamConnectionFailure,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';

async function handle(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  try {
    return await proxyDrillRuntimeToGateway(request, path);
  } catch (err) {
    if (isUpstreamConnectionFailure(err)) {
      return NextResponse.json(
        { message: STUDENT_SAFE_USER_MESSAGES.serverConfig },
        { status: 503 },
      );
    }
    throw err;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handle(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return handle(request, path);
}
