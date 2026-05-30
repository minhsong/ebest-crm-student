'use client';

import type { ReactNode } from 'react';
import { Card, theme, Typography } from 'antd';

const { Text } = Typography;

interface MockTestSelectableCardProps {
	selected: boolean;
	onClick: () => void;
	title: ReactNode;
	subtitle?: ReactNode;
}

/** Card chọn một mục — màu theo Ant Design token. */
export function MockTestSelectableCard({
	selected,
	onClick,
	title,
	subtitle,
}: MockTestSelectableCardProps) {
	const { token } = theme.useToken();

	return (
		<Card
			size="small"
			hoverable={!selected}
			onClick={onClick}
			className="mock-test-select-card h-full"
			styles={{
				body: {
					padding: token.paddingSM,
					minHeight: '100%',
				},
			}}
			style={{
				borderWidth: 1,
				borderStyle: 'solid',
				borderColor: selected ? token.colorPrimary : token.colorBorder,
				background: selected ? token.colorPrimary : token.colorBgContainer,
				boxShadow: selected
					? `0 0 0 2px ${token.colorPrimaryBorder}`
					: undefined,
				transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}, box-shadow ${token.motionDurationMid}`,
			}}
		>
			<Text
				strong
				style={{
					color: selected ? token.colorTextLightSolid : token.colorText,
					display: 'block',
					lineHeight: token.lineHeight,
				}}
			>
				{title}
			</Text>
			{subtitle ? (
				<Text
					style={{
						color: selected ? token.colorTextLightSolid : '#334155',
						opacity: selected ? 0.92 : 1,
						display: 'block',
						fontSize: token.fontSizeSM,
						marginTop: token.marginXXS,
						lineHeight: token.lineHeightSM,
						fontWeight: 500,
					}}
				>
					{subtitle}
				</Text>
			) : null}
		</Card>
	);
}
