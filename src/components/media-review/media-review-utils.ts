import type { MediaReviewComment } from "./types";

export function sortComments(comments: MediaReviewComment[]): MediaReviewComment[] {
	return [...comments].sort((a, b) => {
		if (a.startMs !== b.startMs) return a.startMs - b.startMs;
		return a.id.localeCompare(b.id);
	});
}

export function formatMs(ms: number): string {
	const totalSec = Math.max(0, Math.floor(ms / 1000));
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	}
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseMmSs(input: string): number | null {
	const t = input.trim();
	if (!t) return null;
	const parts = t.split(":").map((p) => p.trim());
	if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
	if (parts.length === 2) {
		const m = Number(parts[0]);
		const s = Number(parts[1]);
		if (m < 0 || s < 0 || s >= 60) return null;
		return (m * 60 + s) * 1000;
	}
	if (parts.length === 3) {
		const h = Number(parts[0]);
		const m = Number(parts[1]);
		const s = Number(parts[2]);
		if (h < 0 || m < 0 || s < 0 || m >= 60 || s >= 60) return null;
		return (h * 3600 + m * 60 + s) * 1000;
	}
	return null;
}

export function findActiveComment(
	comments: MediaReviewComment[],
	timeMs: number,
): MediaReviewComment | null {
	const sorted = sortComments(comments);
	let active: MediaReviewComment | null = null;
	for (const c of sorted) {
		if (c.startMs <= timeMs) active = c;
		else break;
	}
	return active;
}

export function isMediaPlayable(
	mimeType?: string | null,
	resourceKind?: string | null,
): boolean {
	const m = (mimeType ?? "").toLowerCase();
	const k = (resourceKind ?? "").toLowerCase();
	return (
		m.startsWith("audio/") ||
		m.startsWith("video/") ||
		k === "audio" ||
		k === "video"
	);
}

export function getCommentsFromReview(
	review: { attachments?: Record<string, { comments?: MediaReviewComment[] }> } | null | undefined,
	attachmentId: string,
): MediaReviewComment[] {
	const list = review?.attachments?.[attachmentId]?.comments;
	if (!list?.length) return [];
	return sortComments(list);
}

/** Đã có ≥1 nhận xét timeline trên file. */
export function attachmentHasTimelineComments(
	review: { attachments?: Record<string, { comments?: unknown[] }> } | null | undefined,
	attachmentId: string,
): boolean {
	const list = review?.attachments?.[attachmentId]?.comments;
	return Array.isArray(list) && list.length > 0;
}

export function inferMediaKind(
	mimeType?: string | null,
	resourceKind?: string | null,
): "audio" | "video" {
	const m = (mimeType ?? "").toLowerCase();
	const k = (resourceKind ?? "").toLowerCase();
	if (m.startsWith("video/") || k === "video") return "video";
	return "audio";
}
