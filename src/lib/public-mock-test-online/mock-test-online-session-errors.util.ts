import type { MockTestOnlineFunnelStep } from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';
import { mockTestOnlineRestartDescription } from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';

type ErrorCopy = {
	title: string;
	description: string;
	expired?: boolean;
};

/** Map errorCode Gateway → copy UX tiếng Việt (SSOT client). */
const ERROR_CODE_COPY: Record<string, ErrorCopy> = {
	INVALID_CODE: {
		title: 'Mã làm bài không đúng',
		description: 'Kiểm tra lại mã 6 ký tự trong tin nhắn Zalo OA Ebest.',
	},
	CODE_EXPIRED: {
		title: 'Mã làm bài đã hết hạn',
		description: 'Mã chỉ có hiệu lực trong thời gian ngắn sau khi xác minh Zalo.',
		expired: true,
	},
	INVALID_SESSION_TOKEN: {
		title: 'Phiên làm bài không hợp lệ',
		description: 'Vui lòng quay lại trang xác nhận và chọn lại bài thi.',
		expired: true,
	},
	SESSION_MISMATCH: {
		title: 'Liên kết không đúng',
		description: 'Tab hoặc liên kết không khớp với đăng ký của bạn. Hãy bắt đầu lại từ đầu.',
		expired: true,
	},
	REGISTRATION_NOT_FOUND: {
		title: 'Không tìm thấy đăng ký',
		description: 'Phiên có thể đã hết hạn hoặc đã bị hủy.',
		expired: true,
	},
	REGISTRATION_MISMATCH: {
		title: 'Mã đăng ký không khớp',
		description: 'Vui lòng dùng đúng liên kết từ email hoặc trang xác nhận.',
		expired: true,
	},
	REGISTRATION_INVALID: {
		title: 'Đăng ký không hợp lệ',
		description: 'Không thể tiếp tục làm bài với trạng thái hiện tại.',
		expired: true,
	},
	REGISTRATION_SYNC_PENDING: {
		title: 'Đang xử lý đăng ký',
		description: 'Vui lòng đợi vài giây rồi tải lại trang.',
	},
	ZALO_VERIFICATION_REQUIRED: {
		title: 'Chưa xác minh Zalo',
		description: 'Hoàn tất bước xác minh qua Zalo OA trước khi làm bài.',
	},
	EXAM_ALREADY_COMPLETED: {
		title: 'Bạn đã hoàn thành bài thi',
		description: 'Mỗi đăng ký chỉ được làm bài một lần.',
	},
	INVALID_AUTH_REQUEST: {
		title: 'Yêu cầu không hợp lệ',
		description: 'Thiếu mã làm bài hoặc phiên xác minh. Vui lòng thử lại.',
	},
	RATE_LIMITED: {
		title: 'Quá nhiều lần thử',
		description: 'Vui lòng đợi vài phút rồi thử lại.',
	},
};

/** Lỗi server / client khi Redis lead hoặc pending không còn. */
export function isMockTestOnlineSessionExpiredMessage(
	message: string | null | undefined,
): boolean {
	if (!message?.trim()) return false;
	const m = message.toLowerCase();
	return (
		m.includes('đăng ký lại') ||
		m.includes('hết hạn') ||
		m.includes('không tìm thấy đăng ký') ||
		m.includes('không tìm thấy phiên') ||
		m.includes('không tải được phiên') ||
		m.includes('bắt đầu lại') ||
		m.includes('không còn đầy đủ') ||
		m.includes('chưa có phiên')
	);
}

export function resolveMockTestOnlineApiErrorCopy(input: {
	message?: string;
	errorCode?: string;
	step: MockTestOnlineFunnelStep;
}): { title: string; description: string } {
	const code = input.errorCode?.trim();
	if (code && ERROR_CODE_COPY[code]) {
		const copy = ERROR_CODE_COPY[code];
		const description =
			copy.expired === true
				? `${copy.description} ${mockTestOnlineRestartDescription(input.step)}`
				: copy.description;
		return { title: copy.title, description };
	}

	const message = input.message?.trim() || 'Đã xảy ra lỗi.';
	const expired = isMockTestOnlineSessionExpiredMessage(message);
	return {
		title: message,
		description: expired
			? mockTestOnlineRestartDescription(input.step)
			: 'Vui lòng thử lại hoặc liên hệ Ebest nếu lỗi lặp lại.',
	};
}

export function resolveMockTestOnlineErrorCopy(input: {
	message: string;
	step: MockTestOnlineFunnelStep;
	errorCode?: string;
}): { title: string; description: string } {
	return resolveMockTestOnlineApiErrorCopy(input);
}

/** Rút gọn message hiển thị toast từ lỗi API hoặc Error. */
export function mockTestOnlineToastMessage(
	err: unknown,
	step: MockTestOnlineFunnelStep,
	fallback: string,
): string {
	if (err instanceof Error && err.name === 'MockTestOnlineApiError') {
		const apiErr = err as Error & { errorCode?: string };
		return resolveMockTestOnlineApiErrorCopy({
			message: apiErr.message,
			errorCode: apiErr.errorCode,
			step,
		}).title;
	}
	if (err instanceof Error && err.message.trim()) {
		return resolveMockTestOnlineApiErrorCopy({
			message: err.message,
			step,
		}).title;
	}
	return fallback;
}
