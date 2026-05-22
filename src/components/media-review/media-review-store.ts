import type { AssignmentResultMediaReview } from "./types";
import { sortComments } from "./media-review-utils";

export function createMediaReviewCommentId(): string {
	return crypto.randomUUID();
}

export function emptyMediaReview(): AssignmentResultMediaReview {
	return { version: 1, attachments: {} };
}

export function getMediaReviewAttachmentPayload(
	review: AssignmentResultMediaReview | null | undefined,
	attachmentId: string,
) {
	const raw = review?.attachments?.[attachmentId];
	if (!raw) return undefined;
	return {
		...raw,
		comments: sortComments(raw.comments ?? []),
	};
}

/** Chuẩn hóa mọi attachment — comments luôn sort theo startMs tăng dần. */
export function normalizeMediaReviewSorted(
	review: AssignmentResultMediaReview | null,
): AssignmentResultMediaReview | null {
	if (!review?.attachments) return review;
	const attachments: AssignmentResultMediaReview["attachments"] = {};
	for (const [id, payload] of Object.entries(review.attachments)) {
		attachments[id] = {
			...payload,
			comments: sortComments(payload.comments ?? []),
		};
	}
	return { version: review.version, attachments };
}

export function setMediaReviewAttachmentDuration(
	review: AssignmentResultMediaReview | null,
	attachmentId: string,
	durationMs: number,
): AssignmentResultMediaReview {
	const base = review ?? emptyMediaReview();
	const att = base.attachments[attachmentId] ?? { comments: [] };
	return {
		...base,
		attachments: {
			...base.attachments,
			[attachmentId]: { ...att, durationMs },
		},
	};
}
