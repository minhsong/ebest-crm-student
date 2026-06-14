'use client';

import type { VocabularyDrillPresentationProfile } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { PoolCoverageAssignmentProgressBar } from '@/features/learning/games/vocabulary-drill/presentation/layout/PoolCoverageAssignmentProgressBar';
import { SurvivalAssignmentProgressBar } from '@/features/learning/games/vocabulary-drill/presentation/layout/SurvivalAssignmentProgressBar';

type Props = {
  presentation: VocabularyDrillPresentationProfile;
  score: number;
  minimumScore: number;
  poolProgress?: {
    answered: number;
    total: number;
    correct: number;
    wrong: number;
  } | null;
};

export function VocabularyDrillAssignmentProgress({
  presentation,
  score,
  minimumScore,
  poolProgress,
}: Props) {
  if (presentation.usesPoolProgressBar && poolProgress) {
    return (
      <PoolCoverageAssignmentProgressBar progress={poolProgress} minimumScore={minimumScore} />
    );
  }

  return <SurvivalAssignmentProgressBar score={score} minimumScore={minimumScore} />;
}
