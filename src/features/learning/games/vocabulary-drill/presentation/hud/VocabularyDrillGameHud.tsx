'use client';

import type { VocabularyDrillPresentationProfile } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { GameCoreHud } from '@/features/learning/games/vocabulary-drill/presentation/hud/GameCoreHud';
import { PoolCoverageScoreHud } from '@/features/learning/games/vocabulary-drill/presentation/hud/PoolCoverageScoreHud';
import { SurvivalScoreHud } from '@/features/learning/games/vocabulary-drill/presentation/hud/SurvivalScoreHud';

type Props = {
  presentation: VocabularyDrillPresentationProfile;
  title?: string;
  backHref: string;
  score: number;
  streak: number;
};

export function VocabularyDrillGameHud({
  presentation,
  title,
  backHref,
  score,
  streak,
}: Props) {
  const scoreSlot = presentation.usesStreakHud ? (
    <SurvivalScoreHud score={score} streak={streak} />
  ) : (
    <PoolCoverageScoreHud score={score} />
  );

  return (
    <GameCoreHud
      modeLabel={presentation.modeLabel}
      title={title}
      backHref={backHref}
      scoreSlot={scoreSlot}
    />
  );
}
