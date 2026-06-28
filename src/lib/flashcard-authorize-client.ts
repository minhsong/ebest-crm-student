export type FlashcardAuthorizeSuccess = {
  allowed: true;
  classId: number;
  classSessionId: number;
  courseSessionId: number | null;
  sessionTitle?: string;
  modeId?: 'session_review';
  sessionConfig?: {
    gameFamily: 'flashcard_review';
    modeId: 'session_review';
    presentation: {
      coreLayoutProfileId: string;
      detailWidgetId: string;
      resultProfileId: string;
    };
  };
  cards: {
    totalAssetIds: number[];
    batchSize: number;
    firstBatch: Array<Record<string, unknown>>;
  };
};

export type FlashcardAuthorizeResult =
  | FlashcardAuthorizeSuccess
  | { allowed: false; reason: string };

export type FlashcardStartAuthorizeContext = {
  classId: number;
  classSessionId: number;
  courseSessionId: number | null;
  sessionTitle?: string;
  sessionConfig: FlashcardAuthorizeSuccess['sessionConfig'];
  cards: FlashcardAuthorizeSuccess['cards'];
};

export async function authorizeFlashcardSession(
  classId: number,
  classSessionId: number,
): Promise<FlashcardAuthorizeResult> {
  const res = await fetch('/api/student/learning/flashcard/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId, classSessionId }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof (data as { message?: string })?.message === 'string'
        ? (data as { message: string }).message
        : 'Không thể xác thực quyền luyện flashcard.';
    return { allowed: false, reason: message };
  }
  if (data && typeof data === 'object' && 'allowed' in data) {
    return data as FlashcardAuthorizeResult;
  }
  return { allowed: false, reason: 'Phản hồi authorize không hợp lệ.' };
}
