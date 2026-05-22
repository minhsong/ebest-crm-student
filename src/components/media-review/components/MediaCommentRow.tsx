import { Button, Popconfirm, Space, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { MediaReviewComment } from "../types";
import { formatMs } from "../media-review-utils";
import {
	MEDIA_COMMENT_CONTENT_ACTIVE,
	MEDIA_COMMENT_ROW_ACTIVE,
	MEDIA_COMMENT_ROW_BASE,
	MEDIA_COMMENT_TIME_ACTIVE,
} from "../media-review-styles";

const { Text } = Typography;

const TIME_STYLE: React.CSSProperties = {
	flexShrink: 0,
	minWidth: 52,
};

const CONTENT_STYLE: React.CSSProperties = {
	flex: 1,
	minWidth: 0,
};

const ACTIONS_STYLE: React.CSSProperties = {
	flexShrink: 0,
};

type MediaCommentRowProps = {
	comment: MediaReviewComment;
	isActive: boolean;
	isEditMode: boolean;
	busy: boolean;
	playbackDisabled: boolean;
	savingCommentId: string | null;
	onSeek: () => void;
	onEdit: () => void;
	onDelete: () => void;
};

export function MediaCommentRow({
	comment,
	isActive,
	isEditMode,
	busy,
	playbackDisabled,
	savingCommentId,
	onSeek,
	onEdit,
	onDelete,
}: MediaCommentRowProps) {
	return (
		<div
			data-comment-id={comment.id}
			style={{
				...MEDIA_COMMENT_ROW_BASE,
				...(isActive ? MEDIA_COMMENT_ROW_ACTIVE : {}),
			}}
			onClick={onSeek}
		>
			<Text
				code
				style={{
					...TIME_STYLE,
					...(isActive ? MEDIA_COMMENT_TIME_ACTIVE : {}),
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{formatMs(comment.startMs)}
			</Text>
			<Text
				style={{
					...CONTENT_STYLE,
					...(isActive ? MEDIA_COMMENT_CONTENT_ACTIVE : {}),
				}}
			>
				{comment.content}
			</Text>
			{isEditMode ? (
				<Space
					size={0}
					style={ACTIONS_STYLE}
					onClick={(e) => e.stopPropagation()}
				>
					<Tooltip title="Sửa">
						<Button
							type="text"
							size="small"
							icon={<EditOutlined />}
							onClick={onEdit}
							disabled={busy || playbackDisabled}
						/>
					</Tooltip>
					<Popconfirm
						title="Xóa nhận xét này?"
						onConfirm={onDelete}
						okText="Xóa"
						cancelText="Huỷ"
					>
						<Tooltip title="Xóa">
							<Button
								type="text"
								size="small"
								danger
								icon={<DeleteOutlined />}
								loading={savingCommentId === comment.id}
								disabled={busy}
							/>
						</Tooltip>
					</Popconfirm>
				</Space>
			) : null}
		</div>
	);
}
