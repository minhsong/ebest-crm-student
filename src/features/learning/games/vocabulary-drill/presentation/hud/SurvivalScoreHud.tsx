'use client';

import { memo } from 'react';
import { FireOutlined } from '@ant-design/icons';
import { useDrillScoreDisplay } from '@/features/learning/hooks/useDrillScoreDisplay';

type Props = {
  score: number;
  streak: number;
};

function SurvivalScoreHudInner({ score, streak }: Props) {
  const { delta } = useDrillScoreDisplay(score);
  const showStreak = streak >= 3;

  return (
    <div className="drill-score-hud" aria-live="polite">
      <div className="drill-score-hud__value-wrap">
        <span className={`drill-score-hud__value${delta > 0 ? ' is-pop' : ''}`}>
          {score}
        </span>
        {delta > 0 ? <span className="drill-score-hud__delta">+{delta}</span> : null}
      </div>
      <div className="drill-score-hud__meta">
        <span className="drill-score-hud__label">Điểm</span>
        {showStreak ? (
          <span className="drill-score-hud__streak">
            <FireOutlined /> {streak}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export const SurvivalScoreHud = memo(SurvivalScoreHudInner);
