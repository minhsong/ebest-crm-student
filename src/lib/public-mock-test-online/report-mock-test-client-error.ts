/**
 * Client → BFF: báo lỗi segment error.tsx / boundary lên CRM log platform.
 * Gắn requestId (tạo mới nếu chưa có) để correlate.
 */
function newClientRequestId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `mto-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function reportMockTestClientError(input: {
	context: string;
	message: string;
	digest?: string;
	path?: string;
	stack?: string;
	requestId?: string;
	module?: string;
}): string {
	const requestId = input.requestId?.trim() || newClientRequestId();
	void fetch('/api/public/mock-test-online/report-client-error', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Request-Id': requestId,
		},
		body: JSON.stringify({
			context: input.context,
			message: input.message.slice(0, 2000),
			digest: input.digest,
			path: input.path,
			requestId,
			module: input.module,
			stack: input.stack?.slice(0, 4000),
		}),
		keepalive: true,
	}).catch(() => {
		/* noop */
	});
	return requestId;
}
