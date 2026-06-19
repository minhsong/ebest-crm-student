/** Định dạng thời gian làm bài (ms) cho BXH drill. */
export function formatDrillDurationMs(ms: number | null | undefined): string {
	if (ms == null || !Number.isFinite(ms) || ms < 0) {
		return '—';
	}
	const totalSec = Math.max(0, Math.floor(ms / 1000));
	const min = Math.floor(totalSec / 60);
	const sec = totalSec % 60;
	if (min > 0) {
		return `${min}p ${String(sec).padStart(2, '0')}s`;
	}
	return `${sec}s`;
}
