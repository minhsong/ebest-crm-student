'use client';

import type { VocabularyDrillPresentationProfile } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { VocabularyDrillGameHud } from '@/features/learning/games/vocabulary-drill/presentation/hud/VocabularyDrillGameHud';

type Props = {
	presentation: VocabularyDrillPresentationProfile;
	title?: string;
	backHref: string;
	score: number;
	streak: number;
};

/** @deprecated alias — container truyền `presentation`, không `mode`. */
export function DrillGameHud(props: Props) {
	return <VocabularyDrillGameHud {...props} />;
}
