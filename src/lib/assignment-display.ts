/** Dòng phụ dưới tiêu đề bài tập — cùng ý với CRM AssignmentDetailModal. */
export function buildAssignmentSessionLine(
  courseSessionTitle?: string | null,
  classSessionTitle?: string | null,
): string {
  const parts: string[] = [];
  if (courseSessionTitle?.trim()) {
    parts.push(`Bài học mẫu: ${courseSessionTitle.trim()}`);
  }
  if (classSessionTitle?.trim()) {
    parts.push(`Buổi học lớp: ${classSessionTitle.trim()}`);
  }
  return parts.join(' · ');
}

export function getResourceKindLabel(
  kind?: 'audio' | 'slide' | 'document' | 'video' | 'other',
): string {
  switch (kind) {
    case 'audio':
      return 'Âm thanh';
    case 'slide':
      return 'Slide';
    case 'document':
      return 'Tài liệu';
    case 'video':
      return 'Video';
    case 'other':
      return 'Khác';
    default:
      return '';
  }
}
