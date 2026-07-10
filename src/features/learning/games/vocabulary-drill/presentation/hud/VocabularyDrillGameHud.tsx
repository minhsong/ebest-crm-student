'use client';

import { useRouter } from 'next/navigation';

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
  onExitClick?: () => void;
};

export function VocabularyDrillGameHud({
  presentation,
  title,
  backHref,
  score,
  streak,
  onExitClick,
}: Props) {
  const router = useRouter();
  const scoreSlot = presentation.usesStreakHud ? (
    <SurvivalScoreHud score={score} streak={streak} />
  ) : (
    <PoolCoverageScoreHud score={score} />
  );

  const handleExit = onExitClick ?? (() => router.push(backHref));

  return (
    <GameCoreHud
      modeLabel={presentation.modeLabel}
      title={title}
      scoreSlot={scoreSlot}
      onExitClick={handleExit}
    />
  );
}