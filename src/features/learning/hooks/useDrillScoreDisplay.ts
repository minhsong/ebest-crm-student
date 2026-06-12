import { useEffect, useRef, useState } from 'react';

/** Theo dõi delta điểm để animate score board — tách khỏi question stage. */
export function useDrillScoreDisplay(score: number) {
	const prevScoreRef = useRef(score);
	const [delta, setDelta] = useState(0);

	useEffect(() => {
		const prev = prevScoreRef.current;
		if (score > prev) {
			setDelta(score - prev);
		} else if (score < prev) {
			setDelta(0);
		}
		prevScoreRef.current = score;
	}, [score]);

	useEffect(() => {
		if (delta <= 0) return;
		const timer = window.setTimeout(() => setDelta(0), 700);
		return () => window.clearTimeout(timer);
	}, [delta]);

	return { delta };
}
