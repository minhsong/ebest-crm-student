'use client';

import type { VocabularyDrillResultProfileId } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { VocabularyDrillRunResultScreen } from '@/features/learning/games/vocabulary-drill/presentation/VocabularyDrillRunResultScreen';

type Props = {
  score: number;
  bestScore?: number;
  bestTotal?: number;
  wasWrongEnd: boolean;
  variant?: 'survival' | 'pool_coverage';
  poolProgress?: {
    answered: number;
    total: number;
    correct: number;
    wrong: number;
  } | null;
  minimumScore?: number;
  passed?: boolean | null;
  onReplay: () => void;
  leaderboardHref?: string | null;
};

/** @deprecated Dùng `VocabularyDrillRunResultScreen` + `resultProfileId`. */
export function DrillRunResultScreen({ variant = 'survival', ...props }: Props) {
  const resultProfileId: VocabularyDrillResultProfileId =
    variant === 'pool_coverage' ? 'pool_coverage_result' : 'survival_result';

  return <VocabularyDrillRunResultScreen resultProfileId={resultProfileId} {...props} />;
}
