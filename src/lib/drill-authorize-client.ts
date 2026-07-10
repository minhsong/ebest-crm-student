import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

export type DrillAuthorizeSuccess = {
  allowed: true;
  classId: number;
  courseId: number | null;
  assignmentId: number | null;
  checklistId?: number | null;
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
  progress?: {
    bestScore: number;
    minimumScore: number;
    playCount: number;
    checked: boolean;
  };
};

export type DrillAuthorizeResult =
  | DrillAuthorizeSuccess
  | { allowed: false; reason: string };

export type DrillStartAuthorizeContext = Pick<
  DrillAuthorizeSuccess,
  | 'classId'
  | 'courseId'
  | 'assignmentId'
  | 'checklistId'
  | 'sessionConfig'
  | 'rules'
  | 'pool'
  | 'progress'
>;

export async function authorizeDrillSession(
  classId: number,
  options?: {
    assignmentId?: number;
    checklistId?: number;
    classSessionId?: number;
    modeId?: GameSessionConfig['modeId'];
    promptType?: GameSessionConfig['promptType'];
    sessionDurationSec?: 60 | 90 | 120;
  },
): Promise<DrillAuthorizeResult> {
  const res = await fetch('/api/student/learning/drill/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classId,
      assignmentId: options?.assignmentId,
      checklistId: options?.checklistId,
      classSessionId: options?.classSessionId,
      modeId: options?.modeId,
      promptType: options?.promptType,
      sessionDurationSec: options?.sessionDurationSec,
    }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof (data as { message?: string })?.message === 'string'
        ? (data as { message: string }).message
        : 'Không thể xác thực quyền luyện tập.';
    return { allowed: false, reason: message };
  }
  if (data && typeof data === 'object' && 'allowed' in data) {
    return data as DrillAuthorizeResult;
  }
  return { allowed: false, reason: 'Phản hồi authorize không hợp lệ.' };
}
