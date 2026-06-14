'use client';

type Props = {
  progress: {
    answered: number;
    total: number;
    correct: number;
    wrong: number;
  };
  minimumScore: number;
};

export function PoolCoverageAssignmentProgressBar({ progress, minimumScore }: Props) {
  const pct =
    progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0;
  const reached = progress.correct >= minimumScore;

  return (
    <div className="drill-assignment-progress">
      <div className="drill-assignment-progress__row">
        <span>
          Đúng <strong>{progress.correct}</strong> · Sai <strong>{progress.wrong}</strong>
        </span>
        <span>
          <strong>{progress.answered}</strong>/{progress.total} từ
        </span>
      </div>
      <div className="drill-assignment-progress__row">
        <span>
          {reached ? (
            <>Đã đạt yêu cầu {minimumScore} từ đúng</>
          ) : (
            <>Cần đạt {minimumScore} từ đúng để hoàn thành bài</>
          )}
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
