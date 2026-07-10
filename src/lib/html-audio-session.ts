/**
 * Mở khóa phiên HTMLAudioElement sau user gesture (Safari/iOS autoplay policy).
 * Dùng chung learning vocabulary + quiz listening.
 *
 * Gọi đồng bộ trong handler click (trước mọi `await`) khi cần auto-play sau đó.
 */

const SILENT_WAV_DATA_URI =
	'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARSAAABAAAAABAAgAZGF0YQAAAAA=';

let sessionUnlocked = false;
let unlockElement: HTMLAudioElement | null = null;

export function isHtmlAudioSessionUnlocked(): boolean {
	return sessionUnlocked;
}

export function resetHtmlAudioSessionUnlock(): void {
	sessionUnlocked = false;
	if (unlockElement) {
		unlockElement.pause();
		unlockElement.removeAttribute('src');
	}
}

export function unlockHtmlAudioSession(): Promise<boolean> {
	if (typeof window === 'undefined') {
		return Promise.resolve(false);
	}
	if (sessionUnlocked) {
		return Promise.resolve(true);
	}

	try {
		if (!unlockElement) {
			unlockElement = new Audio();
			unlockElement.setAttribute('playsinline', '');
			unlockElement.preload = 'auto';
		}
		unlockElement.src = SILENT_WAV_DATA_URI;
		unlockElement.volume = 0.001;

		const pending = unlockElement.play();
		if (!pending || typeof pending.then !== 'function') {
			sessionUnlocked = true;
			return Promise.resolve(true);
		}

		return pending
			.then(() => {
				unlockElement?.pause();
				if (unlockElement) {
					unlockElement.currentTime = 0;
				}
				sessionUnlocked = true;
				return true;
			})
			.catch(() => false);
	} catch {
		return Promise.resolve(false);
	}
}
