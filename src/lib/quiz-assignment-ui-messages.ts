/**
 * Chuỗi hiển thị người dùng — luồng QUIZ + bài tập (đồng bộ CRM sau submit).
 * Giữ một nơi để đồng nhất copy với CRM `QuizAssignmentStudentMessages` (tiếng Việt).
 */
export const QuizAssignmentUiMessages = {
  syncScoreToAssignmentFailed:
    'Đã nộp bài; điểm chưa ghi vào bài tập lớp — tải lại chi tiết bài tập hoặc báo quản trị.',
  syncNetworkError:
    'Đã nộp bài; không đồng bộ được điểm về bài tập (mạng).',
  maxAttemptsReached: (max: number) =>
    `Đã dùng hết số lần làm cho bài tập này (tối đa ${max}).`,
  attemptsRemaining: (remaining: number, max: number) =>
    `Còn ${remaining}/${max} lượt làm bài.`,
  attemptsUnlimited: 'Không giới hạn số lần làm bài.',
  quizIntro:
    'Làm bài qua bài tập lớp — sau mỗi lần nộp, điểm tự động được đồng bộ về đây.',
  quizRetakeHint:
    'Bạn có thể làm lại nếu còn lượt. Xem các lần làm trước qua «Xem kết quả».',
} as const;
