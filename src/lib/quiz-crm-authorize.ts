import type { NextRequest } from 'next/server';

import { getStudentAccessTokenFromRequest } from '@/lib/crm-student-me';
import { getApiBaseUrl } from '@/lib/env';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

const STUDENT_BASE = '/api/v1/student';

export type QuizAuthorizePayload = {
  formPublicId: string;
  assignmentId?: number;
  mode?: 'assignment' | 'practice';
  intent?: 'access' | 'start';
};

export type QuizAuthorizeResponse =
  | {
      allowed: true;
      mode: 'assignment' | 'practice';
      effectiveMaxAttempts: number | null;
      portalAuthorizeToken?: string;
      context?: Record<string, unknown>;
    }
  | { allowed: false; reason: string };

function unwrapCrmPayload(json: unknown): unknown {
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    if ('result' in o) return o.result;
    if ('data' in o) return o.data;
  }
  return json;
}

/**
 * CRM POST /student/quiz/authorize — bắt buộc trước load/start quiz runtime.
 */
export async function authorizeQuizViaCrm(
  request: NextRequest,
  payload: QuizAuthorizePayload,
): Promise<QuizAuthorizeResponse | null> {
  const apiBase = getApiBaseUrl();
  const token = getStudentAccessTokenFromRequest(request);
  if (!apiBase || !token) return null;

  const url = `${apiBase.replace(/\/$/, '')}${STUDENT_BASE}/quiz/authorize`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
      const raw =
        json && typeof json === 'object' && 'message' in json
          ? String((json as { message: unknown }).message)
          : undefined;
      return {
        allowed: false,
        reason: sanitizeStudentFacingMessage(
          raw,
          'Không thể xác thực quyền làm bài. Vui lòng thử lại.',
        ),
      };
    }
    const inner = unwrapCrmPayload(json);
    if (inner && typeof inner === 'object' && 'allowed' in inner) {
      return inner as QuizAuthorizeResponse;
    }
    return {
      allowed: false,
      reason: 'Không thể xác thực quyền làm bài. Vui lòng thử lại.',
    };
  } catch {
    return {
      allowed: false,
      reason: 'Không thể xác thực quyền làm bài. Vui lòng thử lại.',
    };
  }
}
