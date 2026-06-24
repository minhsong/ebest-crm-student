/**
 * Khớp GET /api/v1/student/assignments/:id (sau unwrap nếu có wrapper).
 */

import type { MediaReviewComment } from '@/components/media-review';

export type { MediaReviewComment };

/** Khớp CRM `resource_kind` — hành vi hiển thị do người nhập liệu chọn, không suy URL. */
export type StudentAssignmentAttachmentResourceKind =
  | 'audio'
  | 'video'
  | 'youtube'
  | 'image'
  | 'slide'
  | 'document'
  | 'powerpoint'
  | 'web_link'
  | 'other';

/** File học viên đã nộp (portal submission). */
export interface StudentSubmissionAttachment {
  id: string;
  fileId?: string | null;
  url: string;
  name: string;
  note?: string | null;
  mimeType?: string | null;
  size?: number | null;
  resourceKind?: StudentAssignmentAttachmentResourceKind | string;
  createdAt?: string | Date;
  mediaReviewComments?: MediaReviewComment[];
  durationMs?: number;
}

export interface StudentAssignmentAttachment {
  id?: string;
  fileId?: string;
  type: 'file' | 'link';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
  resourceKind?: StudentAssignmentAttachmentResourceKind;
  description?: string;
}

export interface StudentAssignmentDetail {
  assignmentId: number;
  title: string;
  type: number;
  typeLabel: string;
  exerciseType: string | null;
  exerciseTypeLabel: string | null;
  scoringType: number | null;
  scoringTypeLabel: string | null;
  /** Điểm tối đa (nếu có) — lấy từ scoringConfig.maxScore */
  scoringMaxScore: number | null;
  content: string | null;
  deadline: string | null;
  attachments: StudentAssignmentAttachment[];
  /** Lớp gắn buổi — route play drill. */
  classId?: number | null;
  classSessionTitle: string | null;
  courseSessionTitle: string | null;
  studentUploadEnabled?: boolean;
  studentUploadMaxFiles?: number;
  /** URL trang làm bài (external_link) */
  externalLinkActivityUrl?: string | null;
  /** Chặn paste clipboard (bài writing). Mặc định false. */
  writingDisablePaste?: boolean;
  /** `free` | `dictation` */
  writingMode?: 'free' | 'dictation';
  /** Bài QUIZ gắn Test form — UUID đề (Gateway). */
  testQuizFormPublicId?: string | null;
  /** Số lần làm tối đa; null = không giới hạn. */
  quizMaxAttempts?: number | null;
  /** Số lần đã nộp (QUIZ + Test form). */
  quizSubmittedCount?: number | null;
  /** Lượt làm còn lại; null = không giới hạn. */
  quizAttemptsRemaining?: number | null;
  submission?: {
    submittedAt?: string | null;
    submittedNote?: string | null;
    submittedExternalUrl?: string | null;
    submittedText?: string | null;
    writingDraftText?: string | null;
    attachments?: StudentSubmissionAttachment[];
  };
  result: {
    resultStatus: number | null;
    scoreDisplay: string | null;
    teacherNote?: string | null;
    assessmentTags?: Array<{
      id: number;
      name: string;
      color: string;
      description?: string;
    }> | null;
  };
  learningAccess?: {
    canSubmit: boolean;
    canStartQuiz: boolean;
    submissionLocked?: boolean;
    readOnlyReason: string | null;
  };
}
