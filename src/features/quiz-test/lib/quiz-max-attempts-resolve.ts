/**
 * SSOT giới hạn lượt — bài tập QUIZ (null = không giới hạn, theo spec CRM).
 * Tách rõ nguồn để tránh Gateway stats thiếu max làm UI hiện "không giới hạn".
 */
export type AssignmentMaxAttemptsSources = {
  /** CRM: authorize.effectiveMaxAttempts hoặc GET quiz-eligibility */
  crm?: number | null;
  /** Session/UI: pin từ danh sách bài tập */
  session?: number | null;
  /** Gateway: query echo hoặc snapshot attempt */
  gateway?: number | null;
};

export function resolveAssignmentQuizMaxAttempts(
  sources: AssignmentMaxAttemptsSources,
): number | null {
  for (const v of [sources.crm, sources.session, sources.gateway]) {
    if (v !== undefined && v !== null) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  return null;
}
