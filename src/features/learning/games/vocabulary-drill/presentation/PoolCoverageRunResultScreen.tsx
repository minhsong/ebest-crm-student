'use client';

import { checklistPenaltyPoolResultCopy } from '@/features/learning/copy/checklist-penalty-game.copy';
import type { DrillResultStudentTone } from '@/features/learning/copy/drill-result-tone';
import { RunResultShell } from '@/features/learning/games/vocabulary-drill/presentation/RunResultShell';

type Props = {
  score: number;
  bestScore?: number;
  bestTotal?: number;
  poolProgress?: {
    answered: number;
    total: number;
    correct: number;
    wrong: number;
  } | null;
  minimumScore?: number;
  passed?: boolean | null;
  studentTone?: DrillResultStudentTone;
  onReplay: () => void;
};

export function PoolCoverageRunResultScreen({
  score,
  bestScore,
  bestTotal,
  poolProgress,
  minimumScore,
  passed,
  studentTone = 'assignment',
  onReplay,
}: Props) {
  const total = poolProgress?.total ?? bestTotal;
  const correct = poolProgress?.correct ?? score;
  const wrong = poolProgress?.wrong ?? 0;
  const metRequirement =
    passed ?? (minimumScore != null ? correct >= minimumScore : correct > 0);

  if (studentTone === 'checklist_penalty') {
    const copy = checklistPenaltyPoolResultCopy({
      correct,
      total,
      wrong,
      minimumScore,
      passed: metRequirement,
      bestScore,
      bestTotal,
    });

    return (
      <RunResultShell
        icon={copy.icon}
        iconTone={copy.iconTone}
        scoreLabel={copy.scoreLabel}
        scoreDisplay={total != null ? `${correct}/${total}` : String(correct)}
        title={copy.title}
        subtitle={<>{copy.subtitleParts.join('')}</>}
        replayLabel={copy.replayLabel}
        onReplay={onReplay}
      />
    );
  }

  return (
    <RunResultShell
      icon={metRequirement ? '🏆' : '📝'}
      iconTone={metRequirement ? 'win' : 'end'}
      scoreLabel="Kết quả của bạn"
      scoreDisplay={total != null ? `${correct}/${total}` : String(correct)}
      title={metRequirement ? 'Tuyệt vời, bạn đã hoàn thành!' : 'Hết lượt rồi — thử lại nhé!'}
      subtitle={
        <>
          Đúng <strong>{correct}</strong>, sai <strong>{wrong}</strong>
          {total != null ? (
            <>
              {' '}
              trên <strong>{total}</strong> từ.
            </>
          ) : null}
          {minimumScore != null ? (
            <>
              {' '}
              Cần đạt <strong>{minimumScore}</strong> từ đúng.
              {!metRequirement ? (
                <> Còn một chút nữa — hãy thử lại, bạn làm được!</>
              ) : null}
            </>
          ) : null}
          {bestScore != null && total != null && metRequirement ? (
            <>
              {' '}
              Kết quả tốt nhất của bạn: {bestScore}/{total}.
            </>
          ) : null}
        </>
      }
      replayLabel="Làm lại"
      onReplay={onReplay}
    />
  );
}
