/**
 * Constants for complete-profile flow (copy, limits).
 * Aligned with CRM API DTO limits.
 */

export const FIELD_LIMITS = {
  firstName: 100,
  lastName: 100,
  nickname: 100,
  primaryEmail: 255,
  primaryPhone: 20,
  identityCardNumber: 20,
  streetAddress: 500,
  emergencyContact: 100,
  emergencyContactRelationship: 100,
  emergencyPhone: 20,
  socialUrl: 500,
} as const;

/** Checkbox đồng ý lưu trữ và sử dụng thông tin (bắt buộc ở bước cuối trước khi hoàn thành). */
export const CONSENT_LABEL =
  'Tôi đồng ý cho Ebest lưu trữ và sử dụng thông tin đã cung cấp để phục vụ quản lý, theo dõi và nâng cao chất lượng đào tạo, kết nối với học viên.';

/** Ghi chú bước thông tin địa chỉ & CCCD – giải thích vì sao cần thông tin nhạy cảm. */
export const ADDRESS_CCCD_STEP_NOTE = {
  title: 'Vì sao chúng tôi cần thông tin này?',
  description:
    'Địa chỉ và số CCCD/CMND được sử dụng để xuất hóa đơn theo quy định của nhà nước. Ebest cam kết bảo mật thông tin của bạn và chỉ sử dụng cho mục đích quản lý, đào tạo và kết nối với học viên.',
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
  /** Hiển thị khi email trùng (complete-profile); yêu cầu liên hệ Fanpage/quản lý. */
  duplicateEmail:
    'Email này đã được sử dụng trong hệ thống. Nếu bạn đã có tài khoản, vui lòng liên hệ Fanpage hoặc quản lý để được hỗ trợ kiểm tra.',
  networkError: 'Không thể kết nối. Vui lòng thử lại.',
  successTitle: 'Cập nhật thành công',
  successDescription: 'Bạn đã hoàn thành cập nhật thông tin. Cảm ơn bạn và chúc bạn có một khoảng thời gian tuyệt vời tại Ebest. 💖',
  createAccountSuccess: 'Tạo tài khoản thành công.',
  createAccountDescription: 'Bạn có thể đăng nhập bằng email/SĐT và mật khẩu vừa đặt.',
} as const;
