import type { MediaTimelineReviewKind } from "../types";

type MediaPlayerProps = {
	mediaUrl: string;
	mediaKind: MediaTimelineReviewKind;
	mediaTitle?: string;
	bindMediaRef: (el: HTMLMediaElement | null) => void;
	onTimeUpdate: () => void;
	onLoadedMetadata: () => void;
};

export function MediaPlayer({
	mediaUrl,
	mediaKind,
	mediaTitle,
	bindMediaRef,
	onTimeUpdate,
	onLoadedMetadata,
}: MediaPlayerProps) {
	return (
		<>
			{mediaTitle ? (
				<strong style={{ display: "block", marginBottom: 8 }}>{mediaTitle}</strong>
			) : null}
			{mediaKind === "video" ? (
				<video
					ref={bindMediaRef}
					src={mediaUrl}
					controls
					preload="metadata"
					style={{ width: "100%", maxHeight: 320, borderRadius: 8 }}
					onTimeUpdate={onTimeUpdate}
					onLoadedMetadata={onLoadedMetadata}
				/>
			) : (
				<audio
					ref={bindMediaRef}
					src={mediaUrl}
					controls
					preload="metadata"
					style={{ width: "100%" }}
					onTimeUpdate={onTimeUpdate}
					onLoadedMetadata={onLoadedMetadata}
				/>
			)}
		</>
	);
}
