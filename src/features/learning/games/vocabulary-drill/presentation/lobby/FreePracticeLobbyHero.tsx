'use client';

import { Button } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

import type { VocabularyDrillLobbyViewModel } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-lobby.mapper';

type Props = {
	vm: VocabularyDrillLobbyViewModel;
	canStart: boolean;
	onStart: () => void;
};

/** Hero + CTA luyện tự do — chọn game/mode qua `GameModePicker` trên hub. */
export function FreePracticeLobbyHero({ vm, canStart, onStart }: Props) {
	return (
		<>
			<div className="drill-lobby-hero">
				<p className="drill-lobby-hero__eyebrow">{vm.eyebrow}</p>
				<h2 className="drill-lobby-hero__title">{vm.title}</h2>
				<p className="drill-lobby-hero__desc">{vm.description}</p>
			</div>

			<Button
				type="primary"
				size="large"
				icon={<ThunderboltOutlined />}
				className="drill-lobby-cta"
				disabled={!canStart}
				onClick={onStart}
			>
				{vm.ctaLabel}
			</Button>
		</>
	);
}
