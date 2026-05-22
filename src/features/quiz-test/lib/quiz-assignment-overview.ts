import type { QuizAssignmentListItem } from '@/features/quiz-test/types';
import { assignmentHasGradedSummary } from '@/lib/assignment-list-row-actions';
import type { StudentAssignmentDetail } from '@/types/student-assignment-detail';
import type { OverviewClassSessions } from '@/types/overview-sessions';

export const EXERCISE_TYPE_QUIZ = 'quiz';

export function isQuizExerciseType(exerciseType: unknown): boolean {
  return String(exerciseType ?? '').trim().toLowerCase() === EXERCISE_TYPE_QUIZ;
}

export function formatAssignmentDeadlineVi(deadlineIso: string | null): string | null {
  if (!deadlineIso) return null;
  const ts = new Date(deadlineIso);
  if (Number.isNaN(ts.getTime())) return null;
  return ts.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sortQuizAssignmentListItems(
  items: QuizAssignmentListItem[],
): QuizAssignmentListItem[] {
  return [...items].sort((a, b) => {
    const aDone = assignmentHasGradedSummary({
      resultStatus: a.resultStatus,
      scoreDisplay: a.scoreDisplay,
    });
    const bDone = assignmentHasGradedSummary({
      resultStatus: b.resultStatus,
      scoreDisplay: b.scoreDisplay,
    });
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.assignmentId - b.assignmentId;
  });
}

/**
 * Gom danh sách bài QUIZ từ payload overview (1 request) — không gọi N lần assignment detail.
 * Mỗi `assignmentId` chỉ một dòng (buổi đầu gặp trong duyệt lớp → buổi).
 */
export function buildQuizAssignmentListFromOverview(
  overviewBlocks: OverviewClassSessions[],
): { items: QuizAssignmentListItem[]; missingLinkedQuizCount: number } {
  const seen = new Map<number, QuizAssignmentListItem>();
  let missingLinkedQuizCount = 0;

  for (const block of overviewBlocks) {
    for (const session of block.sessions ?? []) {
      const sessionTitle = session.title ?? null;
      for (const a of session.assignments ?? []) {
        const id = a.assignmentId;
        if (!Number.isFinite(id)) continue;
        if (!isQuizExerciseType(a.exerciseType)) continue;
        if (seen.has(id)) continue;

        const publicId = (a.testQuizFormPublicId ?? '').trim();
        if (!publicId) {
          missingLinkedQuizCount += 1;
          continue;
        }

        const title = (a.title ?? '').trim() || 'Bài trắc nghiệm';
        seen.set(id, {
          assignmentId: id,
          assignmentTitle: title,
          formPublicId: publicId,
          scoreDisplay: a.scoreDisplay ?? null,
          resultStatus: a.resultStatus ?? null,
          deadline: a.deadline ?? null,
          sessionTitle,
          quizMaxAttempts:
            typeof a.quizMaxAttempts === 'number' ? a.quizMaxAttempts : null,
        });
      }
    }
  }

  return {
    items: sortQuizAssignmentListItems([...seen.values()]),
    missingLinkedQuizCount,
  };
}

export function collectFormPublicIdsForProgress(
  assignmentRows: QuizAssignmentListItem[],
): string[];
export function collectFormPublicIdsForProgress(
  publicForms: Array<{ formPublicId: string }>,
  assignmentRows: QuizAssignmentListItem[],
): string[];
export function collectFormPublicIdsForProgress(
  first: Array<{ formPublicId: string }> | QuizAssignmentListItem[],
  second?: QuizAssignmentListItem[],
): string[] {
  const publicForms =
    second !== undefined
      ? (first as Array<{ formPublicId: string }>)
      : [];
  const assignmentRows =
    second !== undefined ? second : (first as QuizAssignmentListItem[]);
  const ids = new Set<string>();
  for (const row of publicForms) {
    if (row.formPublicId) ids.add(row.formPublicId);
  }
  for (const row of assignmentRows) {
    if (row.formPublicId) ids.add(row.formPublicId);
  }
  return [...ids];
}

/** @deprecated Ưu tiên `buildQuizAssignmentListFromOverview` (1 request, không N+1 detail). */
export type QuizOverviewCandidate = {
  assignmentId: number;
  title: string;
  sessionTitle: string | null;
};

/**
 * Gom assignment QUIZ từ overview — chỉ metadata buổi học (chưa có `testQuizFormPublicId`).
 * @deprecated Dùng `buildQuizAssignmentListFromOverview` khi overview đã embed `testQuizFormPublicId`.
 */
export function extractQuizCandidatesFromOverview(
  overviewBlocks: OverviewClassSessions[],
): QuizOverviewCandidate[] {
  const seen = new Map<number, QuizOverviewCandidate>();
  for (const block of overviewBlocks) {
    for (const session of block.sessions ?? []) {
      const sessionTitle = session.title ?? null;
      for (const a of session.assignments ?? []) {
        const id = a.assignmentId;
        if (!Number.isFinite(id) || !isQuizExerciseType(a.exerciseType)) continue;
        if (seen.has(id)) continue;
        const title = (a.title ?? '').trim() || 'Bài trắc nghiệm';
        seen.set(id, { assignmentId: id, title, sessionTitle });
      }
    }
  }
  return [...seen.values()];
}

export type AssignmentDetailQuizResolve =
  | { kind: 'linked'; item: QuizAssignmentListItem }
  | { kind: 'missing_link' }
  | null;

/** Map CRM assignment detail → dòng danh sách quiz (fallback khi overview thiếu link đề). */
export function mapStudentAssignmentDetailToQuizRow(
  detail: StudentAssignmentDetail,
  fallback: QuizOverviewCandidate,
): AssignmentDetailQuizResolve {
  if (!isQuizExerciseType(detail.exerciseType)) return null;
  if (!detail.testQuizFormPublicId?.trim()) return { kind: 'missing_link' };
  const sessionTitle =
    detail.classSessionTitle?.trim() ||
    detail.courseSessionTitle?.trim() ||
    fallback.sessionTitle;
  return {
    kind: 'linked',
    item: {
      assignmentId: detail.assignmentId,
      assignmentTitle:
        detail.title?.trim() || fallback.title || `Bài tập #${detail.assignmentId}`,
      formPublicId: detail.testQuizFormPublicId.trim(),
      scoreDisplay: detail.result.scoreDisplay,
      resultStatus: detail.result.resultStatus,
      deadline: detail.deadline,
      sessionTitle,
      quizMaxAttempts:
        typeof detail.quizMaxAttempts === 'number' ? detail.quizMaxAttempts : null,
    },
  };
}
