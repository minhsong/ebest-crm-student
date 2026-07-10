'use client';

import { RunResultShell } from '@/features/learning/games/vocabulary-drill/presentation/RunResultShell';

type Props = {
  score: number;
  bestScore?: number;
  onReplay: () => void;
  leaderboardHref?: string | null;
  onLeaderboard?: () => void;
  onGamesHub?: () => void;
};

/** Kết quả Speed run — điểm = số câu đúng trong thời gian phiên. */
export function SpeedRunRunResultScreen({
  score,
  bestScore,
  onReplay,
  onLeaderboard,
  onGamesHub,
}: Props) {
  const beatBest = bestScore != null && score > bestScore;

  return (
    <RunResultShell
      icon="⏱️"
      iconTone="win"
      scoreLabel="Số câu đúng"
      scoreDisplay={String(score)}
      title="Hết giờ!"
      subtitle={
        <>
          Bạn đã trả lời đúng {score} câu trong thời gian phiên.
          {bestScore != null ? (
            <>
              {' '}
              {beatBest
                ? `Kỷ lục mới — vượt ${bestScore} câu!`
                : `Kỷ lục: ${bestScore} câu.`}
            </>
          ) : null}
        </>
      }
      onReplay={onReplay}
      onLeaderboard={onLeaderboard}
      onGamesHub={onGamesHub}
      showLeaderboard={Boolean(onLeaderboard)}
    />
  );
}
