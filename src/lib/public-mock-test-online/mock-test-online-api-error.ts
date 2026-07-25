/** Lỗi API mock-test-online — mang errorCode từ Gateway khi có. */
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

export class MockTestOnlineApiError extends Error {
	readonly errorCode?: string;
	readonly action?: 'login' | 'contact_support' | 'retry';
	readonly detail?: string;
	readonly httpStatus?: number;

	constructor(
		message: string,
		errorCode?: string,
		action?: 'login' | 'contact_support' | 'retry',
		options?: { detail?: string; httpStatus?: number },
	) {
		super(message);
		this.name = 'MockTestOnlineApiError';
		this.errorCode = errorCode;
		this.action = action;
		this.detail = options?.detail;
		this.httpStatus = options?.httpStatus;
	}
}

export function extractMockTestOnlineApiError(data: unknown): {
	message: string;
	errorCode?: string;
	action?: 'login' | 'contact_support' | 'retry';
	detail?: string;
} {
	if (data && typeof data === 'object') {
		const o = data as Record<string, unknown>;
		const errorCode =
			typeof o.errorCode === 'string'
				? o.errorCode.trim()
				: typeof o.code === 'string' && /^[A-Z][A-Z0-9_]*$/.test(o.code)
					? o.code.trim()
					: undefined;
		const action =
			o.action === 'login' ||
			o.action === 'contact_support' ||
			o.action === 'retry'
				? o.action
				: undefined;
		const message = sanitizeStudentFacingMessage(
			typeof o.message === 'string' ? o.message : undefined,
			'Không thể xử lý yêu cầu. Vui lòng thử lại.',
		);
		const detail =
			typeof o.detail === 'string'
				? o.detail
				: typeof o.message === 'string' && o.message !== message
					? o.message
					: undefined;
		return { message, errorCode, action, detail };
	}
	return { message: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' };
}
