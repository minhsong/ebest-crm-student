/**
 * Chuỗi hiển thị người dùng — luồng QUIZ + bài tập (đồng bộ CRM sau submit).
 * Giữ một nơi để đồng nhất copy với CRM `QuizAssignmentStudentMessages` (tiếng Việt).
 */
export const QuizAssignmentUiMessages = {
  syncScoreToAssignmentFailed:
    'Đã nộp bài; điểm chưa ghi vào bài tập lớp — tải lại chi tiết bài tập hoặc báo quản trị.',
  syncNetworkError:
    'Đã nộp bài; không đồng bộ được điểm về bài tập (mạng).',
} as const;
