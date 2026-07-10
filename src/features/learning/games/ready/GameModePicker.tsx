'use client';

import {
	FireOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
} from '@ant-design/icons';

import type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';
import { GameTilePicker } from '@/features/learning/games/catalog-ui/GameTilePicker';

type Props = {
	selection: DrillPracticeSelection;
	onSelectionChange: (selection: DrillPracticeSelection) => void;
};

const MODES = [
	{
		value: 'survival' as const,
		title: 'Survival',
		description: 'Sai 1 câu — hết lượt. Điểm = chuỗi đúng.',
		icon: <FireOutlined />,
	},
	{
		value: 'pool_coverage' as const,
		title: 'Best of…',
		description: 'Chơi hết bộ từ — điểm theo độ chính xác.',
		icon: <TrophyOutlined />,
	},
	{
		value: 'speed_run' as const,
		title: 'Speed run',
		description: 'Trả lời nhiều nhất trong thời gian giới hạn.',
		icon: <ThunderboltOutlined />,
	},
];

export function GameModePicker({ selection, onSelectionChange }: Props) {
	return (
		<GameTilePicker
			label="Chế độ chơi"
			value={selection.modeId}
			columns={2}
			options={MODES}
			onChange={(modeId) => onSelectionChange({ ...selection, modeId })}
		/>
	);
}
