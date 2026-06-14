import type { NextRequest } from 'next/server';

import { getStudentAccessTokenFromRequest } from '@/lib/crm-student-me';
import { getApiBaseUrl } from '@/lib/env';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

const STUDENT_BASE = '/api/v1/student';

export type FlashcardAuthorizePayload = {
  classId: number;
  classSessionId: number;
};

export type FlashcardAuthorizeResponse =
  | {
      allowed: true;
      classId: number;
      classSessionId: number;
      courseSessionId: number | null;
      modeId?: 'session_review';
      sessionConfig?: Record<string, unknown>;
      cards: {
        totalAssetIds: number[];
        batchSize: number;
        firstBatch: Array<Record<string, unknown>>;
      };
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

export async function authorizeFlashcardViaCrm(
  request: NextRequest,
  payload: FlashcardAuthorizePayload,
): Promise<FlashcardAuthorizeResponse | null> {
  const apiBase = getApiBaseUrl();
  const token = getStudentAccessTokenFromRequest(request);
  if (!apiBase || !token) return null;

  const url = `${apiBase.replace(/\/$/, '')}${STUDENT_BASE}/learning/flashcard/authorize`;
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
          'Không thể xác thực quyền luyện flashcard. Vui lòng thử lại.',
        ),
      };
    }
    const inner = unwrapCrmPayload(json);
    if (inner && typeof inner === 'object' && 'allowed' in inner) {
      return inner as FlashcardAuthorizeResponse;
    }
    return {
      allowed: false,
      reason: 'Không thể xác thực quyền luyện flashcard. Vui lòng thử lại.',
    };
  } catch {
    return {
      allowed: false,
      reason: 'Không thể xác thực quyền luyện flashcard. Vui lòng thử lại.',
    };
  }
}
