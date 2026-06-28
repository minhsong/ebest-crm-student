/** Hiệu ứng âm thanh game luyện từ — Web Audio, không cần file ngoài. */

let audioCtx: AudioContext | null = null;

function getGameAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;

	try {
		const AudioCtx =
			window.AudioContext ||
			(window as Window & { webkitAudioContext?: typeof AudioContext })
				.webkitAudioContext;
		if (!AudioCtx) return null;

		if (!audioCtx) {
			audioCtx = new AudioCtx();
		}
		if (audioCtx.state === 'suspended') {
			void audioCtx.resume();
		}
		return audioCtx;
	} catch {
		return null;
	}
}

/** Gọi sau tương tác người dùng để tránh trình duyệt chặn audio. */
export function primeGameAudio(): void {
	getGameAudioContext();
}

function playGainEnvelope(
	ctx: AudioContext,
	gain: GainNode,
	startTime: number,
	attackSec: number,
	peak: number,
	releaseSec: number,
): void {
	gain.gain.setValueAtTime(0.0001, startTime);
	gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), startTime + attackSec);
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attackSec + releaseSec);
}

/** Lật flashcard — swoosh ngắn. */
export function playFlipSound(): void {
	const ctx = getGameAudioContext();
	if (!ctx) return;

	const t0 = ctx.currentTime;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	const filter = ctx.createBiquadFilter();

	osc.type = 'triangle';
	filter.type = 'bandpass';
	filter.frequency.setValueAtTime(1400, t0);
	filter.frequency.exponentialRampToValueAtTime(420, t0 + 0.11);
	filter.Q.value = 0.9;

	osc.connect(filter);
	filter.connect(gain);
	gain.connect(ctx.destination);

	osc.frequency.setValueAtTime(720, t0);
	osc.frequency.exponentialRampToValueAtTime(260, t0 + 0.1);

	playGainEnvelope(ctx, gain, t0, 0.008, 0.14, 0.1);

	osc.start(t0);
	osc.stop(t0 + 0.12);
}

/** Đáp án đúng — ting cao vui. */
export function playDrillCorrectSound(): void {
	const ctx = getGameAudioContext();
	if (!ctx) return;

	const t0 = ctx.currentTime;

	const playTone = (freq: number, start: number, peak: number, duration: number) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq, start);
		osc.connect(gain);
		gain.connect(ctx.destination);
		playGainEnvelope(ctx, gain, start, 0.004, peak, duration);
		osc.start(start);
		osc.stop(start + duration + 0.02);
	};

	playTone(880, t0, 0.16, 0.12);
	playTone(1174.66, t0 + 0.06, 0.12, 0.18);
}

/** Đáp án sai — buzz trầm. */
export function playDrillWrongSound(): void {
	const ctx = getGameAudioContext();
	if (!ctx) return;

	const t0 = ctx.currentTime;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(220, t0);
	osc.frequency.exponentialRampToValueAtTime(95, t0 + 0.22);

	osc.connect(gain);
	gain.connect(ctx.destination);

	playGainEnvelope(ctx, gain, t0, 0.006, 0.1, 0.2);

	osc.start(t0);
	osc.stop(t0 + 0.24);
}

/** Đồng hồ đếm giờ — tick / tock xen kẽ. */
export function playTimerTickSound(secondsLeft: number): void {
	const ctx = getGameAudioContext();
	if (!ctx) return;

	const t0 = ctx.currentTime;
	const isTock = secondsLeft % 2 === 0;
	const freq = isTock ? 620 : 980;

	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = 'square';
	osc.frequency.setValueAtTime(freq, t0);

	osc.connect(gain);
	gain.connect(ctx.destination);

	const peak = secondsLeft <= 3 ? 0.09 : 0.055;
	playGainEnvelope(ctx, gain, t0, 0.002, peak, 0.045);

	osc.start(t0);
	osc.stop(t0 + 0.06);
}
