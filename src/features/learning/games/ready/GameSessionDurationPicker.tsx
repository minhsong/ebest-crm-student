'use client';

import { ClockCircleOutlined } from '@ant-design/icons';

import type { DrillPracticeSelection } from '@/features/learning/hooks/useDrillPracticePool';
import { GameTilePicker } from '@/features/learning/games/catalog-ui/GameTilePicker';

const OPTIONS = [
	{ value: 60 as const, title: '60s', icon: <ClockCircleOutlined /> },
	{ value: 90 as const, title: '90s', icon: <ClockCircleOutlined /> },
	{ value: 120 as const, title: '2 phút', icon: <ClockCircleOutlined /> },
];

type Props = {
	selection: DrillPracticeSelection;
	onDurationChange: (sec: 60 | 90 | 120) => void;
};

export function GameSessionDurationPicker({ selection, onDurationChange }: Props) {
	if (selection.modeId !== 'speed_run') {
		return null;
	}

	const active = selection.sessionDurationSec ?? 90;

	return (
		<GameTilePicker
			label="Thời gian phiên"
			value={active}
			columns={3}
			options={OPTIONS}
			onChange={onDurationChange}
		/>
	);
}
