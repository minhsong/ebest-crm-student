import { useCallback, useMemo, useState } from "react";
import type { MediaReviewComment, MediaReviewSavePayload } from "../types";
import { createMediaReviewCommentId } from "../media-review-store";
import { formatMs, parseMmSs, sortComments } from "../media-review-utils";

type UseMediaTimelineEditorOptions = {
	sortedComments: MediaReviewComment[];
	/** Thời gian phát thực tế (luôn chạy theo media). */
	playbackTimeMs: number;
	durationMs?: number;
	onSaveComment?: (payload: MediaReviewSavePayload) => void | Promise<void>;
};

/**
 * State & handlers cho chế độ edit timeline (draft / sửa / xóa).
 * `pinnedStartMs`: mốc bắt đầu nhận xét — ghim không dừng media.
 */
export function useMediaTimelineEditor({
	sortedComments,
	playbackTimeMs,
	durationMs,
	onSaveComment,
}: UseMediaTimelineEditorOptions) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState("");
	const [editTimeInput, setEditTimeInput] = useState("");
	const [draftContent, setDraftContent] = useState("");
	/** null = theo thời gian phát; số = đã ghim mốc bắt đầu. */
	const [pinnedStartMs, setPinnedStartMs] = useState<number | null>(null);

	const draftStartMs = pinnedStartMs ?? playbackTimeMs;
	const isDraftTimePinned = pinnedStartMs != null;

	const persist = useCallback(
		async (payload: MediaReviewSavePayload) => {
			if (!onSaveComment) return;
			await onSaveComment(payload);
		},
		[onSaveComment],
	);

	const cancelEdit = useCallback(() => {
		setEditingId(null);
		setEditContent("");
		setEditTimeInput("");
	}, []);

	const startEdit = useCallback((c: MediaReviewComment) => {
		setEditingId(c.id);
		setEditContent(c.content);
		setEditTimeInput(formatMs(c.startMs));
	}, []);

	const pinDraftStart = useCallback(() => {
		setPinnedStartMs(playbackTimeMs);
	}, [playbackTimeMs]);

	const unpinDraftStart = useCallback(() => {
		setPinnedStartMs(null);
	}, []);

	const handleSaveDraft = useCallback(async () => {
		const content = draftContent.trim();
		if (!content || !onSaveComment) return;
		const comment: MediaReviewComment = {
			id: createMediaReviewCommentId(),
			startMs: draftStartMs,
			content,
			updatedAt: new Date().toISOString(),
		};
		const next = sortComments([...sortedComments, comment]);
		setDraftContent("");
		setPinnedStartMs(null);
		try {
			await persist({ action: "create", comment, comments: next });
		} catch {
			setDraftContent(content);
			setPinnedStartMs(comment.startMs);
		}
	}, [draftContent, draftStartMs, onSaveComment, persist, sortedComments]);

	const handleSaveEdit = useCallback(async () => {
		if (!editingId) return;
		const content = editContent.trim();
		if (!content) return;
		const parsed = parseMmSs(editTimeInput);
		const startMs =
			parsed ??
			sortedComments.find((c) => c.id === editingId)?.startMs ??
			0;
		if (durationMs != null && startMs > durationMs) return;
		const comment: MediaReviewComment = {
			id: editingId,
			startMs,
			content,
			updatedAt: new Date().toISOString(),
		};
		const next = sortComments(
			sortedComments.map((c) => (c.id === editingId ? comment : c)),
		);
		await persist({ action: "update", comment, comments: next });
		cancelEdit();
	}, [
		cancelEdit,
		durationMs,
		editContent,
		editTimeInput,
		editingId,
		onSaveComment,
		persist,
		sortedComments,
	]);

	const handleDelete = useCallback(
		async (c: MediaReviewComment) => {
			const next = sortedComments.filter((x) => x.id !== c.id);
			await persist({ action: "delete", comment: c, comments: next });
			if (editingId === c.id) cancelEdit();
		},
		[cancelEdit, editingId, persist, sortedComments],
	);

	const applyCurrentPlaybackTime = useCallback(() => {
		setEditTimeInput(formatMs(playbackTimeMs));
	}, [playbackTimeMs]);

	return useMemo(
		() => ({
			editingId,
			editContent,
			setEditContent,
			editTimeInput,
			setEditTimeInput,
			draftContent,
			setDraftContent,
			draftStartMs,
			isDraftTimePinned,
			playbackTimeMs,
			pinDraftStart,
			unpinDraftStart,
			startEdit,
			cancelEdit,
			handleSaveDraft,
			handleSaveEdit,
			handleDelete,
			applyCurrentPlaybackTime,
		}),
		[
			editingId,
			editContent,
			editTimeInput,
			draftContent,
			draftStartMs,
			isDraftTimePinned,
			playbackTimeMs,
			pinDraftStart,
			unpinDraftStart,
			startEdit,
			cancelEdit,
			handleSaveDraft,
			handleSaveEdit,
			handleDelete,
			applyCurrentPlaybackTime,
		],
	);
}
