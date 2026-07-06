/** Lỗi API mock-test-online — mang errorCode từ Gateway khi có. */
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

export class MockTestOnlineApiError extends Error {
	readonly errorCode?: string;

	constructor(message: string, errorCode?: string) {
		super(message);
		this.name = 'MockTestOnlineApiError';
		this.errorCode = errorCode;
	}
}

export function extractMockTestOnlineApiError(data: unknown): {
	message: string;
	errorCode?: string;
} {
	if (data && typeof data === 'object') {
		const o = data as Record<string, unknown>;
		const errorCode =
			typeof o.errorCode === 'string' ? o.errorCode.trim() : undefined;
		const message = sanitizeStudentFacingMessage(
			typeof o.message === 'string' ? o.message : undefined,
			'Không thể xử lý yêu cầu. Vui lòng thử lại.',
		);
		return { message, errorCode };
	}
	return { message: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' };
}
