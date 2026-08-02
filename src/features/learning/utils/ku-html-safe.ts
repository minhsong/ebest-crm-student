/**
 * Strip script/handler cơ bản — defense-in-depth (API đã sanitize lúc manifest).
 * Tránh nested quantifier (ReDoS).
 */
export function safeKuPreviewHtml(html: string | null | undefined): string {
	if (typeof html !== 'string' || !html.trim()) {
		return '';
	}
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<\/?script\b[^>]*>/gi, '')
		.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/javascript:/gi, '');
}

/** Chỉ render ảnh với URL http(s) tuyệt đối. */
export function isSafeHttpUrl(value: unknown): value is string {
	if (typeof value !== 'string') return false;
	const trimmed = value.trim();
	if (!trimmed) return false;
	try {
		const parsed = new URL(trimmed);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}
