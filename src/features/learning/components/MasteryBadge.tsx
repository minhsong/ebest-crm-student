'use client';

import { Tag } from 'antd';
import type { LearningMasteryState } from '@/types/learning';

const COLORS: Record<LearningMasteryState, string> = {
	new: 'default',
	exposed: 'blue',
	learning: 'orange',
};

interface Props {
	state: LearningMasteryState;
	label?: string;
}

export function MasteryBadge({ state, label }: Props) {
	return <Tag color={COLORS[state] ?? 'default'}>{label ?? state}</Tag>;
}
