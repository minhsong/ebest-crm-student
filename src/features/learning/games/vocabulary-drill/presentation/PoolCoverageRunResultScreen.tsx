'use client';

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
  onReplay: () => void;
};

export function PoolCoverageRunResultScreen({
  score,
  bestScore,
  bestTotal,
  poolProgress,
  minimumScore,
  passed,
  onReplay,
}: Props) {
  const total = poolProgress?.total ?? bestTotal;
  const correct = poolProgress?.correct ?? score;
  const wrong = poolProgress?.wrong ?? 0;
  const metRequirement =
    passed ?? (minimumScore != null ? correct >= minimumScore : correct > 0);

  return (
    <RunResultShell
      icon={metRequirement ? '🏆' : '📝'}
      iconTone={metRequirement ? 'win' : 'end'}
      scoreLabel="Kết quả kiểm tra"
      scoreDisplay={total != null ? `${correct}/${total}` : String(correct)}
      title={
        metRequirement ? 'Hoàn thành bài kiểm tra!' : 'Đã chơi hết danh sách từ'
      }
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
              Yêu cầu: đạt <strong>{minimumScore}</strong> từ đúng.
              {!metRequirement ? (
                <> Chưa đủ ngưỡng — chỉ lưu lịch sử, chưa nộp bài.</>
              ) : null}
            </>
          ) : null}
          {bestScore != null && total != null && metRequirement ? (
            <>
              {' '}
              Kết quả cao nhất bài: {bestScore}/{total}.
            </>
          ) : null}
        </>
      }
      replayLabel="Làm lại"
      onReplay={onReplay}
    />
  );
}
