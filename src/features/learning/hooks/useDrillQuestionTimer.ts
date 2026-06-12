import { useEffect, useRef, useState } from 'react';

type Options = {
	questionId: string | null;
	enabled: boolean;
	paused: boolean;
	seconds: number;
	onTimeout: () => void;
	/** Đồng bộ từ Gateway WS `drill:timer:sync` — ưu tiên hơn countdown client. */
	serverSecondsLeft?: number | null;
};

export function useDrillQuestionTimer({
	questionId,
	enabled,
	paused,
	seconds,
	onTimeout,
	serverSecondsLeft,
}: Options) {
	const [secondsLeft, setSecondsLeft] = useState(seconds);
	const onTimeoutRef = useRef(onTimeout);
	const firedForQuestionRef = useRef<string | null>(null);
	onTimeoutRef.current = onTimeout;

	useEffect(() => {
		setSecondsLeft(seconds);
		firedForQuestionRef.current = null;
	}, [questionId, seconds]);

	useEffect(() => {
		if (serverSecondsLeft == null) return;
		setSecondsLeft(serverSecondsLeft);
		if (serverSecondsLeft <= 0) {
			firedForQuestionRef.current = null;
		}
	}, [serverSecondsLeft, questionId]);

	useEffect(() => {
		if (!enabled || paused || !questionId) return;

		if (secondsLeft <= 0) {
			if (firedForQuestionRef.current === questionId) return;
			firedForQuestionRef.current = questionId;
			onTimeoutRef.current();
			return;
		}

		const id = window.setInterval(() => {
			setSecondsLeft((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => window.clearInterval(id);
	}, [enabled, paused, questionId, secondsLeft]);

	return { secondsLeft, totalSeconds: seconds };
}
