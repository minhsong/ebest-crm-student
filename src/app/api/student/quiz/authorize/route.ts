import { NextRequest, NextResponse } from 'next/server';

import { authorizeQuizViaCrm } from '@/lib/quiz-crm-authorize';
import {
  buildClientQuizAuthorizeCacheKey,
  resolveQuizAuthorizeCached,
} from '@/lib/quiz-bff-authorize-cache';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    formPublicId?: string;
    assignmentId?: number;
    mode?: 'assignment' | 'practice';
    intent?: 'access' | 'start';
  } | null;

  if (!body?.formPublicId || typeof body.formPublicId !== 'string') {
    return NextResponse.json(
      { message: 'formPublicId là bắt buộc.' },
      { status: 400 },
    );
  }

  const intent = body.intent === 'start' ? 'start' : 'access';
  const cacheKey = buildClientQuizAuthorizeCacheKey({
    formPublicId: body.formPublicId,
    assignmentId: typeof body.assignmentId === 'number' ? body.assignmentId : undefined,
    mode: body.mode,
    intent,
  });

  const result = await resolveQuizAuthorizeCached(cacheKey, () =>
    authorizeQuizViaCrm(request, {
      formPublicId: body.formPublicId!,
      assignmentId:
        typeof body.assignmentId === 'number' ? body.assignmentId : undefined,
      mode: body.mode,
      intent,
    }),
  );

  if (result === null) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }

  return NextResponse.json(result);
}
