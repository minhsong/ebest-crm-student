export function formatNearestSessionDate(scheduledDate: string, isToday: boolean): string {
	if (isToday) {
		return 'Hôm nay';
	}
	const parsed = new Date(`${scheduledDate}T12:00:00+07:00`);
	if (Number.isNaN(parsed.getTime())) {
		return scheduledDate;
	}
	return new Intl.DateTimeFormat('vi-VN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(parsed);
}
