import type {
  MediaReviewComment,
  StudentAssignmentDetail,
  StudentSubmissionAttachment,
} from '@/types/student-assignment-detail';
import { commentHasFeedback, sortComments } from '@/components/media-review';

function pickRecord(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== 'object') return null;
  return raw as Record<string, unknown>;
}

function parseStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const item of raw) {
    const s = String(item ?? '').trim();
    if (s) out.push(s);
  }
  return out.length ? out : undefined;
}

function parseLiaison(raw: unknown): MediaReviewComment['liaison'] {
  const o = pickRecord(raw);
  if (!o || !Array.isArray(o.items)) return undefined;
  const items: NonNullable<MediaReviewComment['liaison']>['items'] = [];
  for (const row of o.items) {
    const r = pickRecord(row);
    if (!r) continue;
    const word1 = String(r.word1 ?? '').trim();
    const word2 = String(r.word2 ?? '').trim();
    if (!word1 || !word2) continue;
    const linkSound = String(r.linkSound ?? '').trim();
    items.push({
      word1,
      word2,
      ...(linkSound ? { linkSound } : {}),
    });
  }
  return items.length ? { items } : undefined;
}

function parseStress(raw: unknown): MediaReviewComment['stress'] {
  const o = pickRecord(raw);
  if (!o || !Array.isArray(o.items)) return undefined;
  const items: NonNullable<MediaReviewComment['stress']>['items'] = [];
  for (const row of o.items) {
    const r = pickRecord(row);
    if (!r) continue;
    const word = String(r.word ?? '').trim();
    const stressedSyllable = String(r.stressedSyllable ?? '').trim();
    if (!word || !stressedSyllable) continue;
    items.push({ word, stressedSyllable });
  }
  return items.length ? { items } : undefined;
}

function parseIntonation(raw: unknown): MediaReviewComment['intonation'] {
  const o = pickRecord(raw);
  if (!o || !Array.isArray(o.items)) return undefined;
  const items: NonNullable<MediaReviewComment['intonation']>['items'] = [];
  for (const row of o.items) {
    const r = pickRecord(row);
    if (!r) continue;
    const text = String(r.text ?? '').trim();
    if (!text) continue;
    const arrows: Array<'up' | 'down' | 'flat'> = [];
    if (Array.isArray(r.arrows)) {
      for (const a of r.arrows) {
        if (a === 'up' || a === 'down' || a === 'flat') arrows.push(a);
      }
    }
    items.push({ text, arrows });
  }
  return items.length ? { items } : undefined;
}

function parseMediaReviewComments(raw: unknown): MediaReviewComment[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list: MediaReviewComment[] = [];
  for (const item of raw) {
    const o = pickRecord(item);
    if (!o || typeof o.id !== 'string') continue;
    const startMs = Number(o.startMs);
    if (!Number.isFinite(startMs) || startMs < 0) continue;
    const comment: MediaReviewComment = {
      id: o.id,
      startMs: Math.floor(startMs),
      updatedAt:
        typeof o.updatedAt === 'string' ? o.updatedAt : undefined,
    };
    const ipa = parseStringArray(o.ipa);
    const finalSounds = parseStringArray(o.finalSounds);
    const liaison = parseLiaison(o.liaison);
    const stress = parseStress(o.stress);
    const intonation = parseIntonation(o.intonation);
    const note = String(o.note ?? '').trim();
    if (ipa?.length) comment.ipa = ipa;
    if (finalSounds?.length) comment.finalSounds = finalSounds;
    if (liaison) comment.liaison = liaison;
    if (stress) comment.stress = stress;
    if (intonation) comment.intonation = intonation;
    if (note) comment.note = note;
    if (!commentHasFeedback(comment)) continue;
    list.push(comment);
  }
  return list.length ? sortComments(list) : undefined;
}

function parseSubmissionAttachment(raw: unknown): StudentSubmissionAttachment | null {
  const o = pickRecord(raw);
  if (!o || typeof o.id !== 'string' || typeof o.url !== 'string') return null;
  const comments = parseMediaReviewComments(o.mediaReviewComments);
  const durationMs = Number(o.durationMs);
  return {
    id: o.id,
    fileId:
      typeof o.fileId === 'string' || o.fileId === null
        ? (o.fileId as string | null)
        : undefined,
    url: o.url,
    name: typeof o.name === 'string' ? o.name : 'Bài nộp',
    note:
      typeof o.note === 'string' || o.note === null
        ? (o.note as string | null)
        : undefined,
    mimeType:
      typeof o.mimeType === 'string' || o.mimeType === null
        ? (o.mimeType as string | null)
        : undefined,
    size:
      typeof o.size === 'number' || o.size === null
        ? (o.size as number | null)
        : undefined,
    resourceKind:
      typeof o.resourceKind === 'string' ? o.resourceKind : undefined,
    createdAt:
      typeof o.createdAt === 'string' || o.createdAt instanceof Date
        ? (o.createdAt as string | Date)
        : undefined,
    mediaReviewComments: comments,
    durationMs: Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : undefined,
  };
}

function parseSubmission(raw: unknown): StudentAssignmentDetail['submission'] {
  const o = pickRecord(raw);
  if (!o) return undefined;
  const attachments: StudentSubmissionAttachment[] = [];
  if (Array.isArray(o.attachments)) {
    for (const item of o.attachments) {
      const att = parseSubmissionAttachment(item);
      if (att) attachments.push(att);
    }
  }
  return {
    submittedAt:
      typeof o.submittedAt === 'string' || o.submittedAt === null
        ? (o.submittedAt as string | null)
        : undefined,
    submittedNote:
      typeof o.submittedNote === 'string' || o.submittedNote === null
        ? (o.submittedNote as string | null)
        : undefined,
    attachments,
  };
}

/**
 * Chuẩn hóa JSON từ API — luôn có `result` (API có thể thiếu hoặc bọc wrapper).
 */
export function normalizeStudentAssignmentDetail(
  raw: unknown,
): StudentAssignmentDetail | null {
  let o = pickRecord(raw);
  if (!o) return null;

  if (
    o.data != null &&
    typeof o.data === 'object' &&
    'assignmentId' in (o.data as object)
  ) {
    o = o.data as Record<string, unknown>;
  }

  const assignmentId = Number(o.assignmentId);
  if (!Number.isFinite(assignmentId)) return null;

  const res = pickRecord(o.result);
  const scoreRaw = res?.scoreDisplay;
  const scoreDisplay =
    typeof scoreRaw === 'string'
      ? scoreRaw
      : typeof scoreRaw === 'number'
        ? String(scoreRaw)
        : null;

  const attachments = Array.isArray(o.attachments)
    ? (o.attachments as StudentAssignmentDetail['attachments'])
    : [];

  return {
    assignmentId,
    title: typeof o.title === 'string' ? o.title : '',
    type: typeof o.type === 'number' ? o.type : 0,
    typeLabel: typeof o.typeLabel === 'string' ? o.typeLabel : '',
    exerciseType:
      typeof o.exerciseType === 'string' ? o.exerciseType : null,
    exerciseTypeLabel:
      typeof o.exerciseTypeLabel === 'string'
        ? o.exerciseTypeLabel
        : null,
    scoringType:
      typeof o.scoringType === 'number' ? o.scoringType : null,
    scoringTypeLabel:
      typeof o.scoringTypeLabel === 'string' ? o.scoringTypeLabel : null,
    scoringMaxScore:
      typeof o.scoringMaxScore === 'number' ? o.scoringMaxScore : null,
    content: typeof o.content === 'string' ? o.content : null,
    deadline: typeof o.deadline === 'string' ? o.deadline : null,
    attachments,
    classSessionTitle:
      typeof o.classSessionTitle === 'string'
        ? o.classSessionTitle
        : null,
    courseSessionTitle:
      typeof o.courseSessionTitle === 'string'
        ? o.courseSessionTitle
        : null,
    studentUploadEnabled:
      typeof o.studentUploadEnabled === 'boolean' ? o.studentUploadEnabled : undefined,
    studentUploadMaxFiles:
      typeof o.studentUploadMaxFiles === 'number' ? o.studentUploadMaxFiles : undefined,
    testQuizFormPublicId:
      typeof o.testQuizFormPublicId === 'string' && o.testQuizFormPublicId.trim() !== ''
        ? o.testQuizFormPublicId
        : o.testQuizFormPublicId === null
          ? null
          : undefined,
    quizMaxAttempts:
      typeof o.quizMaxAttempts === 'number'
        ? o.quizMaxAttempts
        : o.quizMaxAttempts === null
          ? null
          : undefined,
    quizSubmittedCount:
      typeof o.quizSubmittedCount === 'number'
        ? o.quizSubmittedCount
        : o.quizSubmittedCount === null
          ? null
          : undefined,
    quizAttemptsRemaining:
      typeof o.quizAttemptsRemaining === 'number'
        ? o.quizAttemptsRemaining
        : o.quizAttemptsRemaining === null
          ? null
          : undefined,
    submission: parseSubmission(o.submission),
    result: {
      resultStatus:
        typeof res?.resultStatus === 'number' ? res.resultStatus : null,
      scoreDisplay,
      teacherNote:
        typeof res?.teacherNote === 'string' && res.teacherNote.trim()
          ? res.teacherNote
          : res?.teacherNote === null
            ? null
            : undefined,
      assessmentTags: Array.isArray(res?.assessmentTags)
        ? (res.assessmentTags as StudentAssignmentDetail['result']['assessmentTags'])
        : res?.assessmentTags === null
          ? null
          : undefined,
    },
    learningAccess: parseLearningAccess(o.learningAccess),
  };
}

function parseLearningAccess(
  raw: unknown,
): StudentAssignmentDetail['learningAccess'] {
  const o = pickRecord(raw);
  if (!o) {
    return { canSubmit: true, canStartQuiz: true, readOnlyReason: null };
  }
  return {
    canSubmit: o.canSubmit !== false,
    canStartQuiz: o.canStartQuiz !== false,
    submissionLocked: o.submissionLocked === true,
    readOnlyReason:
      typeof o.readOnlyReason === 'string' && o.readOnlyReason.trim()
        ? o.readOnlyReason
        : null,
  };
}
