import { useEffect, useMemo, useRef } from "react";
import type { MediaReviewComment } from "../types";
import { findActiveComment } from "../media-review-utils";

/**
 * Đồng bộ comment đang active theo thời gian phát + scroll dòng tương ứng vào view.
 */
export function useActiveCommentSync(
	sortedComments: MediaReviewComment[],
	currentTimeMs: number,
	listRef: React.RefObject<HTMLDivElement>,
	onActiveCommentChange?: (comment: MediaReviewComment | null) => void,
) {
	const activeIdRef = useRef<string | null>(null);

	const activeComment = useMemo(
		() => findActiveComment(sortedComments, currentTimeMs),
		[sortedComments, currentTimeMs],
	);

	useEffect(() => {
		onActiveCommentChange?.(activeComment);
		if (activeComment?.id !== activeIdRef.current) {
			activeIdRef.current = activeComment?.id ?? null;
			if (activeComment && listRef.current) {
				const el = listRef.current.querySelector(
					`[data-comment-id="${activeComment.id}"]`,
				);
				el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
			}
		}
	}, [activeComment, listRef, onActiveCommentChange]);

	return activeComment;
}
