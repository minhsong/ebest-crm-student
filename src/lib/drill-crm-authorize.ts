import type { NextRequest } from 'next/server';

import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

import { getStudentAccessTokenFromRequest } from '@/lib/crm-student-me';
import { getApiBaseUrl } from '@/lib/env';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

const STUDENT_BASE = '/api/v1/student';

export type DrillAuthorizePayload = {
  classId: number;
  assignmentId?: number;
  modeId?: GameSessionConfig['modeId'];
  promptType?: GameSessionConfig['promptType'];
};

export type DrillAuthorizeResponse =
  | {
      allowed: true;
      classId: number;
      courseId: number | null;
      assignmentId: number | null;
      modeId: GameSessionConfig['modeId'];
      promptType: GameSessionConfig['promptType'];
      rules: {
        minimumScore: number | null;
        answerTimeoutSec: number;
      };
      pool: {
        totalAssetIds: number[];
        batchSize: number;
        firstBatch: Array<{
          assetId: number;
          word: string;
          meaning?: string;
          tier: 'required' | 'extended';
          promptAudioUrl?: string;
        }>;
      };
      sessionConfig: GameSessionConfig;
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

/** CRM POST /student/learning/drill/authorize */
export async function authorizeDrillViaCrm(
  request: NextRequest,
  payload: DrillAuthorizePayload,
): Promise<DrillAuthorizeResponse | null> {
  const apiBase = getApiBaseUrl();
  const token = getStudentAccessTokenFromRequest(request);
  if (!apiBase || !token) return null;

  const url = `${apiBase.replace(/\/$/, '')}${STUDENT_BASE}/learning/drill/authorize`;
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
          'Không thể xác thực quyền luyện tập. Vui lòng thử lại.',
        ),
      };
    }
    const inner = unwrapCrmPayload(json);
    if (inner && typeof inner === 'object' && 'allowed' in inner) {
      return inner as DrillAuthorizeResponse;
    }
    return {
      allowed: false,
      reason: 'Không thể xác thực quyền luyện tập. Vui lòng thử lại.',
    };
  } catch {
    return {
      allowed: false,
      reason: 'Không thể xác thực quyền luyện tập. Vui lòng thử lại.',
    };
  }
}
