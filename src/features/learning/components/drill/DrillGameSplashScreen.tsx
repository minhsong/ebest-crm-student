'use client';

import { LoadingOutlined } from '@ant-design/icons';
import { Spin, Typography } from 'antd';

type Props = {
	title?: string;
	description?: string;
};

/** Splash khi khởi tạo lượt chơi — tải session + câu hỏi đầu tiên. */
export function DrillGameSplashScreen({
	title = 'Đang chuẩn bị lượt chơi',
	description = 'Đang tải từ vựng và thiết lập phiên chơi…',
}: Props) {
	return (
		<div
			className="drill-game-splash"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<Spin indicator={<LoadingOutlined className="drill-game-splash__icon" spin />} />
			<Typography.Title level={4} className="drill-game-splash__title">
				{title}
			</Typography.Title>
			<Typography.Paragraph type="secondary" className="drill-game-splash__desc">
				{description}
			</Typography.Paragraph>
		</div>
	);
}
