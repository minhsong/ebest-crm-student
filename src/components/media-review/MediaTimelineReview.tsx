import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MediaTimelineReviewProps } from "./types";
import { sortComments } from "./media-review-utils";
import { useMediaPlayback } from "./useMediaPlayback";
import { useActiveCommentSync } from "./hooks/useActiveCommentSync";
import { useMediaTimelineEditor } from "./hooks/useMediaTimelineEditor";
import { MediaPlayer } from "./components/MediaPlayer";
import { MediaCommentsList } from "./components/MediaCommentsList";

export function MediaTimelineReview({
	mode,
	mediaUrl,
	mediaKind,
	mediaTitle,
	comments: commentsProp,
	onSaveComment,
	savingCommentId = null,
	durationMs: durationMsProp,
	onDurationDetected,
	disabled = false,
	onActiveCommentChange,
	onSeek,
	className,
	timelineHeight = 280,
}: MediaTimelineReviewProps) {
	const sorted = useMemo(() => sortComments(commentsProp), [commentsProp]);
	const listRef = useRef<HTMLDivElement>(null);

	const {
		bindMediaRef,
		currentTimeMs,
		durationMs: detectedDurationMs,
		seek,
		play,
		onTimeUpdate,
		onLoadedMetadata,
	} = useMediaPlayback(mediaUrl, mediaKind);

	const durationMs = durationMsProp ?? detectedDurationMs;

	useEffect(() => {
		if (detectedDurationMs != null) {
			onDurationDetected?.(detectedDurationMs);
		}
	}, [detectedDurationMs, onDurationDetected]);

	const activeComment = useActiveCommentSync(
		sorted,
		currentTimeMs,
		listRef,
		onActiveCommentChange,
	);

	const editor = useMediaTimelineEditor({
		sortedComments: sorted,
		playbackTimeMs: currentTimeMs,
		durationMs,
		onSaveComment,
	});

	const handleSeekComment = useCallback(
		(c: { startMs: number }) => {
			seek(c.startMs);
			onSeek?.(c.startMs);
			play();
		},
		[onSeek, play, seek],
	);

	const listBusy = disabled;
	const draftDisabled = disabled;
	const draftSaving = savingCommentId === "draft";

	return (
		<div className={className} style={{ width: "100%" }}>
			<MediaPlayer
				mediaUrl={mediaUrl}
				mediaKind={mediaKind}
				mediaTitle={mediaTitle}
				bindMediaRef={bindMediaRef}
				onTimeUpdate={onTimeUpdate}
				onLoadedMetadata={onLoadedMetadata}
			/>
			<MediaCommentsList
				mode={mode}
				sortedComments={sorted}
				activeCommentId={activeComment?.id}
				editingId={editor.editingId}
				editContent={editor.editContent}
				editTimeInput={editor.editTimeInput}
				draftContent={editor.draftContent}
				draftStartMs={editor.draftStartMs}
				playbackTimeMs={editor.playbackTimeMs}
				isDraftTimePinned={editor.isDraftTimePinned}
				listBusy={listBusy}
				draftDisabled={draftDisabled}
				draftSaving={draftSaving}
				playbackDisabled={false}
				savingCommentId={savingCommentId}
				timelineHeight={timelineHeight}
				listRef={listRef}
				onSeekComment={handleSeekComment}
				onStartEdit={editor.startEdit}
				onDeleteComment={editor.handleDelete}
				onEditTimeChange={editor.setEditTimeInput}
				onEditContentChange={editor.setEditContent}
				onUsePlaybackTime={editor.applyCurrentPlaybackTime}
				onSaveEdit={editor.handleSaveEdit}
				onCancelEdit={editor.cancelEdit}
				onDraftChange={editor.setDraftContent}
				onPinDraftTime={editor.pinDraftStart}
				onUnpinDraftTime={editor.unpinDraftStart}
				onSaveDraft={editor.handleSaveDraft}
				hasSaveHandler={Boolean(onSaveComment)}
			/>
		</div>
	);
}
