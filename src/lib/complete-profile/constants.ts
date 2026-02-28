/**
 * Constants for complete-profile flow (copy, limits).
 * Aligned with CRM API DTO limits.
 */

export const FIELD_LIMITS = {
  firstName: 100,
  lastName: 100,
  primaryEmail: 255,
  primaryPhone: 20,
  occupation: 100,
  emergencyContact: 100,
  emergencyPhone: 20,
  socialUrl: 500,
} as const;

export const WELCOME = {
  title: 'Chào mừng bạn đến với Ebest English',
  bullets: [
    'Để thủ tục ghi danh khóa học diễn ra thuận lợi, bạn vui lòng đọc kỹ và điền đúng thông tin vào form bên dưới nhé.',
    'Mọi thắc mắc khi đăng ký, bạn vui lòng nhắn tin qua Fanpage E-best English để được hỗ trợ sớm nhất.',
  ],
  closing: 'Cảm ơn bạn và chúc bạn có một khoảng thời gian tuyệt vời tại Ebest. 💖',
} as const;

export const MESSAGES = {
  updateSuccess: 'Cập nhật thông tin thành công.',
  updateFailed: 'Cập nhật thất bại. Vui lòng thử lại.',
  networkError: 'Không thể kết nối. Vui lòng thử lại.',
  successTitle: 'Cập nhật thành công',
  successDescription: 'Bạn đã hoàn thành cập nhật thông tin. Cảm ơn bạn và chúc bạn có một khoảng thời gian tuyệt vời tại Ebest. 💖',
} as const;
