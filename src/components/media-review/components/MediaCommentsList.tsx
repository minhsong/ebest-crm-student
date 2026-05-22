import { useRef } from "react";
import { Typography } from "antd";
import type { MediaReviewComment, MediaTimelineReviewMode } from "../types";
import { MediaCommentDraftRow } from "./MediaCommentDraftRow";
import { MediaCommentEditRow } from "./MediaCommentEditRow";
import { MediaCommentRow } from "./MediaCommentRow";

const { Text } = Typography;

type MediaCommentsListProps = {
	mode: MediaTimelineReviewMode;
	sortedComments: MediaReviewComment[];
	activeCommentId: string | undefined;
	editingId: string | null;
	editContent: string;
	editTimeInput: string;
	draftContent: string;
	draftStartMs: number;
	playbackTimeMs: number;
	isDraftTimePinned: boolean;
	listBusy: boolean;
	draftDisabled: boolean;
	draftSaving: boolean;
	playbackDisabled: boolean;
	savingCommentId: string | null;
	timelineHeight: number;
	onSeekComment: (comment: MediaReviewComment) => void;
	onStartEdit: (comment: MediaReviewComment) => void;
	onDeleteComment: (comment: MediaReviewComment) => void;
	onEditTimeChange: (value: string) => void;
	onEditContentChange: (value: string) => void;
	onUsePlaybackTime: () => void;
	onSaveEdit: () => void;
	onCancelEdit: () => void;
	onDraftChange: (value: string) => void;
	onPinDraftTime: () => void;
	onUnpinDraftTime: () => void;
	onSaveDraft: () => void;
	hasSaveHandler: boolean;
	listRef?: React.Ref<HTMLDivElement>;
};

export function MediaCommentsList({
	mode,
	sortedComments,
	activeCommentId,
	editingId,
	editContent,
	editTimeInput,
	draftContent,
	draftStartMs,
	playbackTimeMs,
	isDraftTimePinned,
	listBusy,
	draftDisabled,
	draftSaving,
	playbackDisabled,
	savingCommentId,
	timelineHeight,
	onSeekComment,
	onStartEdit,
	onDeleteComment,
	onEditTimeChange,
	onEditContentChange,
	onUsePlaybackTime,
	onSaveEdit,
	onCancelEdit,
	onDraftChange,
	onPinDraftTime,
	onUnpinDraftTime,
	onSaveDraft,
	hasSaveHandler,
	listRef: listRefProp,
}: MediaCommentsListProps) {
	const internalRef = useRef<HTMLDivElement>(null);
	const listRef = listRefProp ?? internalRef;
	const isEdit = mode === "edit";

	/** Chỉ khóa dòng khác khi đang lưu sửa/xóa một dòng; lưu draft không khóa. */
	const rowBusy = (commentId: string) =>
		listBusy ||
		(savingCommentId != null &&
			savingCommentId !== "draft" &&
			savingCommentId !== commentId);

	return (
		<div
			style={{
				marginTop: 12,
				maxHeight: timelineHeight,
				display: "flex",
				flexDirection: "column",
				border: "1px solid #f0f0f0",
				borderRadius: 8,
				overflow: "hidden",
			}}
		>
			<div
				ref={listRef}
				style={{
					flex: 1,
					minHeight: 0,
					overflowY: "auto",
					padding: "8px 8px 0",
				}}
			>
				{sortedComments.map((c) => {
					if (isEdit && editingId === c.id) {
						return (
							<MediaCommentEditRow
								key={c.id}
								editTimeInput={editTimeInput}
								editContent={editContent}
								busy={savingCommentId === c.id}
								saving={savingCommentId === c.id}
								onTimeChange={onEditTimeChange}
								onContentChange={onEditContentChange}
								onUsePlaybackTime={onUsePlaybackTime}
								onSave={() => void onSaveEdit()}
								onCancel={onCancelEdit}
							/>
						);
					}
					return (
						<MediaCommentRow
							key={c.id}
							comment={c}
							isActive={activeCommentId === c.id}
							isEditMode={isEdit}
							busy={rowBusy(c.id)}
							playbackDisabled={false}
							savingCommentId={savingCommentId}
							onSeek={() => onSeekComment(c)}
							onEdit={() => onStartEdit(c)}
							onDelete={() => void onDeleteComment(c)}
						/>
					);
				})}

				{sortedComments.length === 0 && !isEdit ? (
					<Text type="secondary" style={{ padding: 8, display: "block" }}>
						Chưa có nhận xét theo thời gian.
					</Text>
				) : null}

				{sortedComments.length === 0 && isEdit ? (
					<Text type="secondary" style={{ padding: "4px 8px 8px", display: "block" }}>
						Chưa có nhận xét — ghim mốc thời gian rồi nhập bên dưới.
					</Text>
				) : null}
			</div>

			{isEdit ? (
				<div style={{ flexShrink: 0, borderTop: "1px solid #f0f0f0" }}>
					<MediaCommentDraftRow
						draftStartMs={draftStartMs}
						playbackTimeMs={playbackTimeMs}
						isTimePinned={isDraftTimePinned}
						draftContent={draftContent}
						disabled={draftDisabled}
						saving={draftSaving}
						hasSaveHandler={hasSaveHandler}
						onDraftChange={onDraftChange}
						onPinTime={onPinDraftTime}
						onUnpinTime={onUnpinDraftTime}
						onSave={onSaveDraft}
					/>
				</div>
			) : null}
		</div>
	);
}
