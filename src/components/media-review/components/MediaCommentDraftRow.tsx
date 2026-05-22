import { useEffect, useRef } from "react";
import { Button, Input, Space, Tag, Tooltip, Typography } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import {
	PushpinOutlined,
	SaveOutlined,
	SyncOutlined,
} from "@ant-design/icons";
import { formatMs } from "../media-review-utils";

const { Text } = Typography;

type MediaCommentDraftRowProps = {
	/** Mốc bắt đầu dùng khi lưu (ghim hoặc theo phát). */
	draftStartMs: number;
	/** Thời gian phát hiện tại (hiển thị khi chưa ghim). */
	playbackTimeMs: number;
	isTimePinned: boolean;
	draftContent: string;
	disabled: boolean;
	saving: boolean;
	hasSaveHandler: boolean;
	onDraftChange: (value: string) => void;
	onPinTime: () => void;
	onUnpinTime: () => void;
	onSave: () => void;
};

const ROW_FLEX: React.CSSProperties = {
	display: "flex",
	alignItems: "flex-end",
	gap: 8,
	width: "100%",
	padding: "10px 12px",
	background: "#fffbe6",
};

const TIME_COL: React.CSSProperties = {
	flexShrink: 0,
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: 4,
	minWidth: 56,
	marginBottom: 4,
};

const INPUT_FLEX: React.CSSProperties = {
	flex: 1,
	minWidth: 0,
};

const ACTIONS_STYLE: React.CSSProperties = {
	flexShrink: 0,
	display: "flex",
	alignItems: "center",
	gap: 4,
	paddingBottom: 2,
};

export function MediaCommentDraftRow({
	draftStartMs,
	playbackTimeMs,
	isTimePinned,
	draftContent,
	disabled,
	saving,
	hasSaveHandler,
	onDraftChange,
	onPinTime,
	onUnpinTime,
	onSave,
}: MediaCommentDraftRowProps) {
	const inputRef = useRef<TextAreaRef>(null);

	useEffect(() => {
		if (!disabled && !saving) {
			inputRef.current?.focus();
		}
	}, [disabled, saving]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!saving && draftContent.trim() && hasSaveHandler) {
				void onSave();
			}
		}
	};

	return (
		<div style={ROW_FLEX}>
			<div style={TIME_COL}>
				<Text
					code
					style={{
						color: isTimePinned ? "#1677ff" : undefined,
						fontWeight: isTimePinned ? 600 : undefined,
					}}
				>
					{formatMs(draftStartMs)}
				</Text>
				{isTimePinned ? (
					<Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
						Đã ghim
					</Tag>
				) : (
					<Text type="secondary" style={{ fontSize: 11 }}>
						Phát: {formatMs(playbackTimeMs)}
					</Text>
				)}
			</div>
			<Input.TextArea
				ref={inputRef}
				placeholder="Nhập nhận xét… Ghim mốc thời gian trước (media vẫn phát). Enter gửi."
				autoSize={{ minRows: 1, maxRows: 4 }}
				value={draftContent}
				onChange={(e) => onDraftChange(e.target.value)}
				onKeyDown={handleKeyDown}
				style={INPUT_FLEX}
				disabled={disabled}
			/>
			<Space style={ACTIONS_STYLE} size={4}>
				{isTimePinned ? (
					<Tooltip title="Bỏ ghim — theo thời gian phát">
						<Button
							type="default"
							size="small"
							icon={<SyncOutlined />}
							onClick={onUnpinTime}
							disabled={disabled || saving}
						/>
					</Tooltip>
				) : (
					<Tooltip title="Ghi mốc bắt đầu đoạn (không dừng media)">
						<Button
							type="default"
							size="small"
							icon={<PushpinOutlined />}
							onClick={onPinTime}
							disabled={disabled || saving}
						/>
					</Tooltip>
				)}
				<Tooltip title="Lưu nhận xét">
					<Button
						type="primary"
						icon={<SaveOutlined />}
						onClick={() => void onSave()}
						loading={saving}
						disabled={
							disabled || saving || !draftContent.trim() || !hasSaveHandler
						}
					/>
				</Tooltip>
			</Space>
		</div>
	);
}
