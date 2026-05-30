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

/** Lịch thi thử public — có thứ trong tuần, không hiển thị mã buổi. */
export function formatMockTestSessionSchedule(iso?: string | null): string {
	if (!iso) return '—';
	try {
		const date = new Date(iso);
		const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date);
		const datePart = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
		const timePart = new Intl.DateTimeFormat('vi-VN', {
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
		return `${weekday}, ${datePart} · ${timePart}`;
	} catch {
		return iso;
	}
}
