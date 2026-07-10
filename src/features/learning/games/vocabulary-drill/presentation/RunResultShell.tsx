'use client';

import type { ReactNode } from 'react';
import { Button } from 'antd';
import { AppstoreOutlined, FireOutlined, HomeOutlined, TrophyOutlined } from '@ant-design/icons';
import '@/features/learning/components/drill/drill-survival.css';

type Props = {
  icon: string;
  iconTone: 'win' | 'end';
  scoreLabel: string;
  scoreDisplay: string;
  title: string;
  subtitle: ReactNode;
  replayLabel: string;
  onReplay: () => void;
  leaderboardHref?: string | null;
  onLeaderboard?: () => void;
  onGamesHub?: () => void;
  showLeaderboard?: boolean;
};

/** Shell chung màn hình kết quả game (GE-V4). */
export function RunResultShell({
  icon,
  iconTone,
  scoreLabel,
  scoreDisplay,
  title,
  subtitle,
  replayLabel,
  onReplay,
  onLeaderboard,
  onGamesHub,
  showLeaderboard = false,
}: Props) {
  return (
    <div className="drill-run-result">
      <div
        className={`drill-run-result__icon${iconTone === 'win' ? ' is-win' : ' is-end'}`}
      >
        {icon}
      </div>
      <p className="drill-run-result__score-label">{scoreLabel}</p>
      <p className="drill-run-result__score">{scoreDisplay}</p>
      <h2 className="drill-run-result__title">{title}</h2>
      <p className="drill-run-result__sub">{subtitle}</p>
      <div className="drill-run-result__actions">
        <Button type="primary" size="large" block onClick={onReplay}>
          <FireOutlined /> {replayLabel}
        </Button>
        {onGamesHub ? (
          <Button size="large" block icon={<AppstoreOutlined />} onClick={onGamesHub}>
            Game khác
          </Button>
        ) : (
          <Button size="large" block icon={<HomeOutlined />} onClick={() => window.location.assign('/learning')}>
            Về Học tập
          </Button>
        )}
      </div>
      {showLeaderboard && onLeaderboard ? (
        <Button
          type="link"
          className="drill-run-result__hint-btn"
          icon={<TrophyOutlined />}
          onClick={onLeaderboard}
        >
          Xem bảng xếp hạng lớp
        </Button>
      ) : null}
    </div>
  );
}
