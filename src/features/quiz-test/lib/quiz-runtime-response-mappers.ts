import type {
  QuizAttemptProgressItem,
  QuizPublishedFormSummary,
} from '@/features/quiz-test/types';

export function toQuizPublishedFormSummaries(
  rawItems: unknown,
): QuizPublishedFormSummary[] {
  const rows = Array.isArray(rawItems) ? rawItems : [];
  return rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      const formPublicId = typeof r.formPublicId === 'string' ? r.formPublicId : '';
      if (!formPublicId) return null;
      return {
        formPublicId,
        crmFormId: Number(r.crmFormId) || 0,
        name: r.name === null ? null : typeof r.name === 'string' ? r.name : String(r.name ?? ''),
        catalogKey:
          r.catalogKey === null ? null : typeof r.catalogKey === 'string' ? r.catalogKey : null,
        catalogPath:
          r.catalogPath === null || r.catalogPath === undefined
            ? null
            : typeof r.catalogPath === 'string'
              ? r.catalogPath
              : null,
        type: r.type === null ? null : typeof r.type === 'string' ? r.type : null,
        durationSeconds: Number(r.durationSeconds) || 0,
        publishedAt: typeof r.publishedAt === 'string' ? r.publishedAt : null,
        updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : null,
      } satisfies QuizPublishedFormSummary;
    })
    .filter(Boolean) as QuizPublishedFormSummary[];
}

export function toQuizProgressMap(rawItems: unknown): Record<string, QuizAttemptProgressItem> {
  const rows = Array.isArray(rawItems) ? rawItems : [];
  const map: Record<string, QuizAttemptProgressItem> = {};
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const formPublicId = typeof r.formPublicId === 'string' ? r.formPublicId : '';
    const attemptPublicId = typeof r.attemptPublicId === 'string' ? r.attemptPublicId : '';
    if (!formPublicId || !attemptPublicId) continue;
    const submittedRaw = r.submittedAt;
    const submittedAt =
      submittedRaw === null || submittedRaw === undefined
        ? null
        : typeof submittedRaw === 'string'
          ? submittedRaw
          : null;
    map[formPublicId] = {
      formPublicId,
      attemptPublicId,
      status: typeof r.status === 'string' ? r.status : 'in_progress',
      startedAt: typeof r.startedAt === 'string' ? r.startedAt : '',
      expiresAt: typeof r.expiresAt === 'string' ? r.expiresAt : '',
      submittedAt,
      remainingSeconds: Number(r.remainingSeconds) || 0,
    };
  }
  return map;
}
