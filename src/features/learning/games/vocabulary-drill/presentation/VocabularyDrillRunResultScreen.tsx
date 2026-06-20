'use client';

import type { VocabularyDrillResultProfileId } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { PoolCoverageRunResultScreen } from '@/features/learning/games/vocabulary-drill/presentation/PoolCoverageRunResultScreen';
import { SurvivalRunResultScreen } from '@/features/learning/games/vocabulary-drill/presentation/SurvivalRunResultScreen';

import type { DrillResultStudentTone } from '@/features/learning/copy/drill-result-tone';

type SharedProps = {
  score: number;
  bestScore?: number;
  bestTotal?: number;
  wasWrongEnd: boolean;
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

type Props = SharedProps & {
  resultProfileId: VocabularyDrillResultProfileId;
  studentTone?: DrillResultStudentTone;
};

/** Router kết quả theo presentation profile — không branch mode string (GE-V4). */
export function VocabularyDrillRunResultScreen({
  resultProfileId,
  studentTone = 'assignment',
  ...props
}: Props) {
  if (resultProfileId === 'pool_coverage_result') {
    return (
      <PoolCoverageRunResultScreen
        studentTone={studentTone}
        score={props.score}
        bestScore={props.bestScore}
        bestTotal={props.bestTotal}
        poolProgress={props.poolProgress}
        minimumScore={props.minimumScore}
        passed={props.passed}
        onReplay={props.onReplay}
      />
    );
  }

  return (
    <SurvivalRunResultScreen
      score={props.score}
      bestScore={props.bestScore}
      minimumScore={props.minimumScore}
      passed={props.passed}
      wasWrongEnd={props.wasWrongEnd}
      onReplay={props.onReplay}
      leaderboardHref={props.leaderboardHref}
    />
  );
}
