'use client';

import { memo } from 'react';

type Props = {
  score: number;
};

/** Pool coverage — chỉ hiển thị điểm, không streak (GE-V4). */
function PoolCoverageScoreHudInner({ score }: Props) {
  return (
    <div className="drill-score-hud" aria-live="polite">
      <div className="drill-score-hud__value-wrap">
        <span className="drill-score-hud__value">{score}</span>
      </div>
      <div className="drill-score-hud__meta">
        <span className="drill-score-hud__label">Đúng</span>
      </div>
    </div>
  );
}

export const PoolCoverageScoreHud = memo(PoolCoverageScoreHudInner);
