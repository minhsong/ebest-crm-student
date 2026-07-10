'use client';

import { Button, Space } from 'antd';
import { CheckOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons';

type Props = {
	knownLabel: string;
	unknownLabel: string;
	canRate: boolean;
	autoPlayActive: boolean;
	onStartAutoPlay: () => void;
	onStopAutoPlay: () => void;
	onRateKnown: () => void;
	onRateUnknown: () => void;
};

export function FlashcardSessionActions({
	knownLabel,
	unknownLabel,
	canRate,
	autoPlayActive,
	onStartAutoPlay,
	onStopAutoPlay,
	onRateKnown,
	onRateUnknown,
}: Props) {
	return (
		<div className="flashcard-actions">
			<Space size="middle" wrap>
				{autoPlayActive ? (
					<Button size="large" danger icon={<StopOutlined />} onClick={onStopAutoPlay}>
						Stop
					</Button>
				) : (
					<Button size="large" onClick={onStartAutoPlay}>
						Auto Play
					</Button>
				)}
				<Button
					type="primary"
					size="large"
					icon={<CheckOutlined />}
					disabled={!canRate || autoPlayActive}
					onClick={onRateKnown}
				>
					{knownLabel}
				</Button>
				<Button
					danger
					size="large"
					icon={<CloseOutlined />}
					disabled={!canRate || autoPlayActive}
					onClick={onRateUnknown}
				>
					{unknownLabel}
				</Button>
			</Space>
		</div>
	);
}
