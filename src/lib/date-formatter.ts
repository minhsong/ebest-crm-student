export function formatDateTimeDisplay(iso?: string | null): string {
	if (!iso) return '—';
	try {
		return new Intl.DateTimeFormat('vi-VN', {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(new Date(iso));
	} catch {
		return iso;
	}
}
