'use client';

type Props = {
  score: number;
  minimumScore: number;
};

export function SurvivalAssignmentProgressBar({ score, minimumScore }: Props) {
  const pct = Math.min(100, Math.round((score / minimumScore) * 100));
  const reached = score >= minimumScore;
  const remaining = Math.max(0, minimumScore - score);

  return (
    <div className="drill-assignment-progress">
      <div className="drill-assignment-progress__row">
        <span>
          {reached ? (
            <>
              Đã đạt <strong>{minimumScore}</strong> điểm yêu cầu
            </>
          ) : (
            <>
              Còn <strong>{remaining}</strong> điểm để hoàn thành bài
            </>
          )}
        </span>
        <span>
          <strong>{score}</strong>/{minimumScore}
        </span>
      </div>
      <div className="drill-assignment-progress__track">
        <div
          className="drill-assignment-progress__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
