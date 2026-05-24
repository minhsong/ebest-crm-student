import type { CSSProperties } from "react";

export const MEDIA_COMMENT_ROW_BASE: CSSProperties = {
	display: "flex",
	alignItems: "flex-start",
	gap: 8,
	padding: "10px 8px",
	borderBottom: "1px solid #f0f0f0",
	cursor: "pointer",
	transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
};

export const MEDIA_COMMENT_ROW_ACTIVE: CSSProperties = {
	background: "#e6f4ff",
	border: "2px solid #1677ff",
	borderRadius: 6,
	boxShadow: "0 0 0 1px rgba(22, 119, 255, 0.2)",
	margin: "2px 0",
};

export const MEDIA_COMMENT_TIME_ACTIVE: CSSProperties = {
	fontWeight: 700,
	color: "#0958d9",
};

export const MEDIA_COMMENT_CONTENT_ACTIVE: CSSProperties = {
	fontWeight: 600,
	color: "#141414",
};

export const FEEDBACK_COLUMNS_ROW_STYLE: CSSProperties = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	alignItems: "stretch",
};

export const FEEDBACK_COLUMN_CARD_STYLE: CSSProperties = {
	flex: "1 1 108px",
	minWidth: 100,
	maxWidth: "100%",
};

export const INTONATION_ARROW_COLOR = "var(--ant-color-info, #1677ff)";
