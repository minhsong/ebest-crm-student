import { NextRequest, NextResponse } from 'next/server';

import { proxyFlashcardRuntimeToGateway } from '@/lib/learning-flashcard-gateway-proxy';
import {
  isUpstreamConnectionFailure,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
    return await proxyFlashcardRuntimeToGateway(request, path ?? []);
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

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}
