import { Button, Input, Tooltip } from "antd";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";

const ROW_FLEX: React.CSSProperties = {
	display: "flex",
	alignItems: "flex-end",
	gap: 8,
	width: "100%",
	padding: "8px 4px",
	borderBottom: "1px solid #f5f5f5",
	background: "#fafafa",
};

const TIME_INPUT_STYLE: React.CSSProperties = {
	flexShrink: 0,
	width: 72,
};

const INPUT_FLEX: React.CSSProperties = {
	flex: 1,
	minWidth: 0,
};

const ACTIONS_STYLE: React.CSSProperties = {
	flexShrink: 0,
	display: "flex",
	alignItems: "center",
	gap: 0,
	paddingBottom: 2,
};

type MediaCommentEditRowProps = {
	editTimeInput: string;
	editContent: string;
	busy: boolean;
	saving: boolean;
	onTimeChange: (value: string) => void;
	onContentChange: (value: string) => void;
	onUsePlaybackTime: () => void;
	onSave: () => void;
	onCancel: () => void;
};

export function MediaCommentEditRow({
	editTimeInput,
	editContent,
	busy,
	saving,
	onTimeChange,
	onContentChange,
	onUsePlaybackTime,
	onSave,
	onCancel,
}: MediaCommentEditRowProps) {
	return (
		<div style={ROW_FLEX}>
			<Input
				size="small"
				style={TIME_INPUT_STYLE}
				value={editTimeInput}
				onChange={(e) => onTimeChange(e.target.value)}
				placeholder="mm:ss"
				disabled={busy}
			/>
			<Button size="small" onClick={onUsePlaybackTime} disabled={busy}>
				Vị trí đang phát
			</Button>
			<Input.TextArea
				autoSize={{ minRows: 1, maxRows: 4 }}
				value={editContent}
				onChange={(e) => onContentChange(e.target.value)}
				style={INPUT_FLEX}
				disabled={busy}
			/>
			<div style={ACTIONS_STYLE}>
				<Tooltip title="Lưu">
					<Button
						type="text"
						icon={<SaveOutlined />}
						onClick={onSave}
						loading={saving}
						disabled={busy}
					/>
				</Tooltip>
				<Tooltip title="Hủy">
					<Button
						type="text"
						icon={<CloseOutlined />}
						onClick={onCancel}
						disabled={busy}
					/>
				</Tooltip>
			</div>
		</div>
	);
}
