export interface MediaReviewComment {
	id: string;
	startMs: number;
	content: string;
	updatedAt?: string;
}

export interface AssignmentResultMediaReview {
	version: 1;
	attachments: Record<
		string,
		{
			durationMs?: number;
			comments: MediaReviewComment[];
		}
	>;
}

export type MediaTimelineReviewMode = "view" | "edit";

export type MediaTimelineReviewKind = "audio" | "video";

export type MediaReviewSaveAction = "create" | "update" | "delete";

export interface MediaReviewSavePayload {
	action: MediaReviewSaveAction;
	comment: MediaReviewComment;
	comments: MediaReviewComment[];
	attachmentId?: string;
}

export interface MediaTimelineReviewProps {
	mode: MediaTimelineReviewMode;
	mediaUrl: string;
	mediaKind: MediaTimelineReviewKind;
	mediaTitle?: string;
	comments: MediaReviewComment[];
	onSaveComment?: (payload: MediaReviewSavePayload) => void | Promise<void>;
	savingCommentId?: string | null;
	durationMs?: number;
	onDurationDetected?: (durationMs: number) => void;
	disabled?: boolean;
	playbackDisabled?: boolean;
	onActiveCommentChange?: (comment: MediaReviewComment | null) => void;
	onSeek?: (timeMs: number) => void;
	className?: string;
	timelineHeight?: number;
}
