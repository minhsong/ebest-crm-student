import { useCallback, useEffect, useRef, useState } from "react";

export function useMediaPlayback(mediaUrl: string, mediaKind: "audio" | "video") {
	const mediaRef = useRef<HTMLMediaElement | null>(null);
	const [currentTimeMs, setCurrentTimeMs] = useState(0);
	const [durationMs, setDurationMs] = useState<number | undefined>();

	const seek = useCallback((ms: number) => {
		const el = mediaRef.current;
		if (!el) return;
		el.currentTime = ms / 1000;
		setCurrentTimeMs(ms);
	}, []);

	const play = useCallback(() => {
		void mediaRef.current?.play();
	}, []);

	useEffect(() => {
		setCurrentTimeMs(0);
		setDurationMs(undefined);
	}, [mediaUrl, mediaKind]);

	const bindMediaRef = useCallback((el: HTMLMediaElement | null) => {
		mediaRef.current = el;
	}, []);

	const onTimeUpdate = useCallback(() => {
		const el = mediaRef.current;
		if (!el) return;
		setCurrentTimeMs(Math.floor(el.currentTime * 1000));
	}, []);

	const onLoadedMetadata = useCallback(() => {
		const el = mediaRef.current;
		if (!el || !Number.isFinite(el.duration)) return;
		setDurationMs(Math.floor(el.duration * 1000));
	}, []);

	return {
		bindMediaRef,
		currentTimeMs,
		durationMs,
		seek,
		play,
		onTimeUpdate,
		onLoadedMetadata,
	};
}
