/**
 * Dòng phụ dưới tiêu đề bài tập (Student Portal).
 *
 * Student Portal chỉ nên hiển thị "buổi học của lớp" theo góc nhìn học viên;
 * không đưa các khái niệm nội bộ như "bài học mẫu / template" lên UI.
 */
export function buildAssignmentSessionLine(
  courseSessionTitle?: string | null,
  classSessionTitle?: string | null,
): string {
  if (classSessionTitle?.trim()) return classSessionTitle.trim();
  // Fallback: nếu thiếu classSessionTitle thì hiển thị tối thiểu một tiêu đề.
  if (courseSessionTitle?.trim()) return courseSessionTitle.trim();
  return '';
}

export function getResourceKindLabel(
  kind?: string,
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
    case 'youtube':
      return 'YouTube / video nhúng';
    case 'image':
      return 'Hình ảnh';
    case 'powerpoint':
      return 'PowerPoint';
    case 'web_link':
      return 'Liên kết web';
    case 'other':
      return 'Khác';
    default:
      return '';
  }
}
