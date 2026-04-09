/**
 * Khớp GET /api/v1/student/assignments/:id (sau unwrap nếu có wrapper).
 */

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
  content: string | null;
  deadline: string | null;
  attachments: StudentAssignmentAttachment[];
  classSessionTitle: string | null;
  courseSessionTitle: string | null;
  result: {
    resultStatus: number | null;
    scoreDisplay: string | null;
  };
}
