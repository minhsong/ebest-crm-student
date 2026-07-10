'use client';

import { RunResultShell } from '@/features/learning/games/vocabulary-drill/presentation/RunResultShell';

type Props = {
  score: number;
  bestScore?: number;
  minimumScore?: number;
  passed?: boolean | null;
  wasWrongEnd: boolean;
  onReplay: () => void;
  leaderboardHref?: string | null;
  onLeaderboard?: () => void;
  onGamesHub?: () => void;
};

export function SurvivalRunResultScreen({
  score,
  bestScore,
  minimumScore,
  passed,
  wasWrongEnd,
  onReplay,
  leaderboardHref,
  onLeaderboard,
  onGamesHub,
}: Props) {
  const beatBest = bestScore != null && score > bestScore;
  const assignmentRun = minimumScore != null;
  const reachedAssignmentGoal = passed === true;

  let title = wasWrongEnd ? 'Hết lượt rồi!' : 'Xuất sắc!';
  if (assignmentRun && reachedAssignmentGoal) {
    title = 'Đã đạt yêu cầu bài!';
  } else if (assignmentRun && passed === false) {
    title = wasWrongEnd ? 'Chưa đạt yêu cầu bài' : 'Hoàn thành lượt';
  }

  return (
    <RunResultShell
      icon={wasWrongEnd ? '💫' : reachedAssignmentGoal ? '🏆' : '✨'}
      iconTone={wasWrongEnd && !reachedAssignmentGoal ? 'end' : 'win'}
      scoreLabel="Điểm lượt này"
      scoreDisplay={String(score)}
      title={title}
      subtitle={
        <>
          {assignmentRun ? (
            <>
              {reachedAssignmentGoal
                ? `Bạn đã đạt ngưỡng ${minimumScore} điểm trong lượt này. `
                : passed === false
                  ? `Cần đạt tối thiểu ${minimumScore} điểm liên tiếp trong một lượt. Lượt này chỉ lưu lịch sử — chưa nộp bài. `
                  : null}
            </>
          ) : null}
          {wasWrongEnd
            ? 'Một câu trả lời sai kết thúc lượt chơi. Thử lại và giữ chuỗi điểm dài hơn nhé.'
            : 'Bạn đã hoàn thành lượt chơi.'}
          {bestScore != null ? (
            <>
              {' '}
              {beatBest
                ? `Kỷ lục mới — vượt ${bestScore} điểm!`
                : `Kỷ lục bài: ${bestScore} điểm.`}
            </>
          ) : null}
        </>
      }
      replayLabel="Chơi lại"
      onReplay={onReplay}
      onLeaderboard={onLeaderboard}
      onGamesHub={onGamesHub}
      showLeaderboard
    />
  );
}
