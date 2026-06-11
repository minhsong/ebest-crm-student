/** Âm thanh lật thẻ ngắn — Web Audio, không cần file ngoài. */
export function playFlashcardFlipSound(): void {
	if (typeof window === 'undefined') return;

	try {
		const AudioCtx =
			window.AudioContext ||
			(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioCtx) return;

		const ctx = new AudioCtx();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'sine';
		osc.connect(gain);
		gain.connect(ctx.destination);

		const t0 = ctx.currentTime;
		osc.frequency.setValueAtTime(920, t0);
		osc.frequency.exponentialRampToValueAtTime(340, t0 + 0.07);
		gain.gain.setValueAtTime(0.0001, t0);
		gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.012);
		gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);

		osc.start(t0);
		osc.stop(t0 + 0.1);

		void ctx.close();
	} catch {
		// Bỏ qua nếu trình duyệt chặn autoplay / AudioContext
	}
}
