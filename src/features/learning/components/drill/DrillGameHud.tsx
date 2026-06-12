'use client';

import Link from 'next/link';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { DrillGameMode } from '@/features/learning/hooks/useDrillPracticePool';
import { DrillScoreHud } from './DrillScoreBoard';

type Props = {
	mode: DrillGameMode;
	title?: string;
	backHref: string;
	score: number;
	streak: number;
};

export function DrillGameHud({ mode, title, backHref, score, streak }: Props) {
	const modeLabel = mode === 'audio_to_word' ? 'Nghe' : 'Survival';

	return (
		<header className="drill-game-hud">
			<Link href={backHref} className="drill-game-hud__exit">
				<ArrowLeftOutlined />
				<span className="hidden sm:inline">Thoát</span>
			</Link>
			<div className="drill-game-hud__center">
				<span className="drill-game-hud__mode">{modeLabel}</span>
				{title ? <span className="drill-game-hud__title">{title}</span> : null}
			</div>
			<DrillScoreHud score={score} streak={streak} />
		</header>
	);
}
