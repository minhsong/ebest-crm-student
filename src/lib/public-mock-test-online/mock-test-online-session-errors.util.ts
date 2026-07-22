import type { MockTestOnlineFunnelStep } from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';
import { mockTestOnlineRestartDescription } from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';

export type MockTestOnlineErrorRecovery =
	| 'restart'
	| 'lead_tests'
	| 'retry'
	| 'login'
	| 'contact_support'
	| 'none';

export type MockTestOnlineErrorCopy = {
	title: string;
	description: string;
	/** Hết hạn / mất phiên → CTA bắt đầu lại. */
	expired?: boolean;
	recovery?: MockTestOnlineErrorRecovery;
};

/** Map errorCode Gateway → copy UX tiếng Việt (SSOT client). Không lộ jargon hệ thống. */
const ERROR_CODE_COPY: Record<string, MockTestOnlineErrorCopy> = {
	EXAM_SESSION_EXPIRED: {
		title: 'Phiên làm bài đã hết hạn',
		description:
			'Bạn cần xác nhận lại để vào phòng thi. Nếu còn bài đang làm dở, hãy tiếp tục từ lịch sử thi hoặc đăng ký lại.',
		expired: true,
		recovery: 'lead_tests',
	},
	EXAM_GATE_ERROR: {
		title: 'Không kiểm tra được phiên thi',
		description:
			'Không tải được thông tin vào phòng thi. Vui lòng thử lại hoặc quay lại bước xác nhận.',
		recovery: 'retry',
	},
	FORM_MISMATCH: {
		title: 'Bài thi không khớp',
		description:
			'Liên kết mở không đúng bài thi bạn đã chọn. Hãy quay lại chọn bài thi hoặc dùng đúng liên kết.',
		recovery: 'restart',
	},
	MISSING_FORM: {
		title: 'Thiếu thông tin đề thi',
		description: 'Không xác định được đề thi. Vui lòng chọn lại bài thi từ đầu.',
		recovery: 'restart',
	},
	POST_EXAM_DESTINATION_FAILED: {
		title: 'Không xác định được bước tiếp theo',
		description:
			'Bài đã nộp thành công nhưng hệ thống chưa xác định được trang tiếp theo. Bạn có thể đăng nhập hoặc mở lịch sử thi thủ công.',
		recovery: 'login',
	},
	INVALID_CODE: {
		title: 'Mã làm bài không đúng',
		description: 'Kiểm tra lại mã 6 ký tự trong tin nhắn Zalo OA Ebest.',
		recovery: 'retry',
	},
	CODE_EXPIRED: {
		title: 'Mã làm bài đã hết hạn',
		description:
			'Mã chỉ có hiệu lực trong thời gian ngắn sau khi bạn xác minh trên Zalo. Hãy gửi lại tin xác nhận để nhận mã mới.',
		expired: true,
		recovery: 'restart',
	},
	INVALID_SESSION_TOKEN: {
		title: 'Phiên làm bài không còn hiệu lực',
		description: 'Vui lòng quay lại chọn bài thi để tiếp tục.',
		expired: true,
		recovery: 'restart',
	},
	SESSION_MISMATCH: {
		title: 'Liên kết không đúng',
		description:
			'Tab hoặc liên kết không khớp với đăng ký của bạn. Hãy bắt đầu lại từ đầu.',
		expired: true,
		recovery: 'restart',
	},
	REGISTRATION_NOT_FOUND: {
		title: 'Không tìm thấy đăng ký',
		description: 'Đăng ký có thể đã hết hạn hoặc đã bị hủy.',
		expired: true,
		recovery: 'restart',
	},
	REGISTRATION_MISMATCH: {
		title: 'Mã đăng ký không khớp',
		description: 'Vui lòng dùng đúng liên kết từ trang xác nhận của bạn.',
		expired: true,
		recovery: 'restart',
	},
	REGISTRATION_INVALID: {
		title: 'Không thể tiếp tục đăng ký này',
		description: 'Trạng thái đăng ký hiện tại không cho phép vào làm bài.',
		expired: true,
		recovery: 'restart',
	},
	REGISTRATION_SYNC_PENDING: {
		title: 'Đang xử lý đăng ký',
		description: 'Vui lòng đợi vài giây rồi tải lại trang.',
		recovery: 'retry',
	},
	ZALO_VERIFICATION_REQUIRED: {
		title: 'Chưa xác minh Zalo',
		description: 'Hoàn tất bước nhắn tin xác nhận trên Zalo trước khi làm bài.',
		recovery: 'retry',
	},
	EXAM_ALREADY_COMPLETED: {
		title: 'Bạn đã hoàn thành bài thi',
		description: 'Mỗi đăng ký chỉ được làm bài một lần.',
		recovery: 'lead_tests',
	},
	ATTEMPT_EXPIRED: {
		title: 'Hết hạn vào làm bài',
		description:
			'Thời gian được phép vào phòng thi đã hết. Bạn cần chọn lại bài thi và xác minh lại nếu vẫn muốn thi.',
		expired: true,
		recovery: 'restart',
	},
	INVALID_AUTH_REQUEST: {
		title: 'Không thể xác nhận vào thi',
		description: 'Thiếu thông tin cần thiết. Vui lòng thử lại từ trang xác nhận.',
		recovery: 'retry',
	},
	RATE_LIMITED: {
		title: 'Tạm thời bị giới hạn',
		description:
			'Bạn đã đăng ký thành công hoặc thao tác quá nhiều trong thời gian ngắn. Đợi theo hướng dẫn rồi thử lại — lần đăng ký lỗi trước đó không bị tính vào giới hạn này.',
		recovery: 'retry',
	},
	PORTAL_EMAIL_ALREADY_REGISTERED: {
		title: 'Email đã có trên hệ thống',
		description:
			'Nếu đây là email của bạn: bấm «Gửi link tiếp tục qua email» để nối lại đăng ký (không cần mật khẩu), hoặc đăng nhập Google / cổng học viên nếu đã có tài khoản. Có thể dùng email khác nếu bạn muốn tạo hồ sơ mới.',
		recovery: 'login',
	},
	EMAIL_ALREADY_IN_SYSTEM: {
		title: 'Email đã có trên hệ thống',
		description:
			'Nếu đây là email của bạn: bấm «Gửi link tiếp tục qua email» để nối lại đăng ký (không cần mật khẩu), hoặc đăng nhập Google / cổng học viên nếu đã có tài khoản. Có thể dùng email khác nếu bạn muốn tạo hồ sơ mới.',
		recovery: 'login',
	},
	PORTAL_PHONE_ALREADY_REGISTERED: {
		title: 'Số điện thoại đã gắn tài khoản khác',
		description:
			'Đăng nhập tài khoản gắn với số này để tiếp tục, hoặc dùng số khác. Liên hệ Fanpage Ebest nếu bạn cần hỗ trợ.',
		recovery: 'login',
	},
	PHONE_ALREADY_IN_SYSTEM: {
		title: 'Số điện thoại đã gắn tài khoản khác',
		description:
			'Đăng nhập tài khoản gắn với số này để tiếp tục, hoặc dùng số khác. Liên hệ Fanpage Ebest nếu bạn cần hỗ trợ.',
		recovery: 'login',
	},
	CONTACT_ALREADY_REGISTERED: {
		title: 'Thông tin liên hệ đã có trên hệ thống',
		description:
			'Đăng nhập cổng học viên để tiếp tục thi thử, hoặc đổi email/SĐT rồi thử lại. Liên hệ Fanpage Ebest nếu cần hỗ trợ.',
		recovery: 'login',
	},
	INTAKE_TEMPORARILY_UNAVAILABLE: {
		title: 'Tạm thời chưa đăng ký được',
		description:
			'Hệ thống đang bận hoặc có sự cố tạm thời. Vui lòng thử lại sau vài phút. Nếu vẫn lỗi, liên hệ Fanpage Ebest.',
		recovery: 'retry',
	},
	ACCESS_DENIED: {
		title: 'Không còn lượt thi thử',
		description:
			'Bạn đã dùng hết lượt thi thử online cho loại đề này. Xem lịch sử thi hoặc liên hệ Ebest để được tư vấn.',
		recovery: 'lead_tests',
	},
	MAX_ATTEMPTS_EXCEEDED: {
		title: 'Không còn lượt thi thử',
		description:
			'Bạn đã dùng hết lượt thi thử online cho loại đề này. Xem lịch sử thi hoặc liên hệ Ebest để được tư vấn.',
		recovery: 'lead_tests',
	},
	CHANNEL_ALREADY_CONSUMED: {
		title: 'Lượt xác minh này đã dùng rồi',
		description:
			'Bạn đã dùng lượt gắn với lần xác minh Zalo này. Liên hệ Ebest nếu cần hỗ trợ thi lại.',
		recovery: 'lead_tests',
	},
	ENTITLEMENT_UNAVAILABLE: {
		title: 'Tạm thời chưa mở được bài thi',
		description: 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.',
		recovery: 'retry',
	},
	ENTITLEMENT_CONSUME_FAILED: {
		title: 'Chưa bắt đầu được bài thi',
		description:
			'Thử bấm bắt đầu lại. Nếu vẫn không được, tải lại trang hoặc liên hệ Ebest.',
		recovery: 'retry',
	},
	PHONE_MIRROR_EXCEEDED: {
		title: 'Số điện thoại đã đạt giới hạn',
		description:
			'Số điện thoại này đã dùng hết lượt thi thử cho loại đề. Liên hệ Ebest để được hỗ trợ.',
		recovery: 'lead_tests',
	},
	CHANNEL_REQUIRED: {
		title: 'Cần xác minh trên Zalo',
		description: 'Hoàn tất bước nhắn tin xác nhận trên Zalo trước khi làm bài.',
		recovery: 'retry',
	},
	POLICY_DENY: {
		title: 'Chưa đủ điều kiện vào thi',
		description: 'Bạn chưa đủ điều kiện bắt đầu bài thi này. Vui lòng liên hệ Ebest.',
		recovery: 'lead_tests',
	},
	NOT_AUTHENTICATED: {
		title: 'Phiên đăng ký không còn hiệu lực',
		description: 'Vui lòng bắt đầu lại từ trang đăng ký thi thử.',
		expired: true,
		recovery: 'restart',
	},
	RESOURCE_CLOSED: {
		title: 'Chiến dịch đã đóng',
		description: 'Bài thi này không còn nhận thí sinh mới.',
		recovery: 'lead_tests',
	},
	RESUME_AUTH_REQUIRED: {
		title: 'Cần xác nhận lại để tiếp tục',
		description: 'Phiên vào thi đã hết. Quay lại trang xác nhận để mở lại bài đang làm dở.',
		expired: true,
		recovery: 'restart',
	},
	REGISTRATION_NOT_IN_EXAM: {
		title: 'Chưa có bài thi đang làm',
		description: 'Không tìm thấy bài đang làm dở. Hãy chọn bài thi và vào làm lại.',
		recovery: 'restart',
	},
	LEAD_SESSION_REQUIRED: {
		title: 'Cần đăng nhập lại',
		description: 'Vui lòng đăng nhập cổng học viên rồi thử tiếp tục bài thi.',
		recovery: 'lead_tests',
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
}): MockTestOnlineErrorCopy {
	const code = input.errorCode?.trim();
	if (code && ERROR_CODE_COPY[code]) {
		const copy = ERROR_CODE_COPY[code];
		const description =
			copy.expired === true
				? `${copy.description} ${mockTestOnlineRestartDescription(input.step)}`
				: copy.description;
		return {
			title: copy.title,
			description,
			expired: copy.expired,
			recovery: copy.recovery ?? (copy.expired ? 'restart' : 'none'),
		};
	}

	const message = input.message?.trim() || 'Đã xảy ra lỗi.';
	const expired = isMockTestOnlineSessionExpiredMessage(message);
	return {
		title: message,
		description: expired
			? mockTestOnlineRestartDescription(input.step)
			: 'Vui lòng thử lại hoặc liên hệ Fanpage Ebest nếu lỗi lặp lại.',
		expired,
		recovery: expired ? 'restart' : 'retry',
	};
}

export function resolveMockTestOnlineErrorCopy(input: {
	message: string;
	step: MockTestOnlineFunnelStep;
	errorCode?: string;
}): MockTestOnlineErrorCopy {
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

export function mockTestOnlineErrorCopyFromUnknown(
	err: unknown,
	step: MockTestOnlineFunnelStep,
	fallbackTitle: string,
): MockTestOnlineErrorCopy {
	if (err instanceof Error && err.name === 'MockTestOnlineApiError') {
		const apiErr = err as Error & { errorCode?: string };
		return resolveMockTestOnlineApiErrorCopy({
			message: apiErr.message || fallbackTitle,
			errorCode: apiErr.errorCode,
			step,
		});
	}
	if (err instanceof Error && err.message.trim()) {
		return resolveMockTestOnlineApiErrorCopy({
			message: err.message,
			step,
		});
	}
	return {
		title: fallbackTitle,
		description: 'Vui lòng thử lại hoặc liên hệ Fanpage Ebest nếu lỗi lặp lại.',
		recovery: 'retry',
	};
}
