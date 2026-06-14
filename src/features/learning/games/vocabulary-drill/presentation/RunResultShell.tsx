'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from 'antd';
import { FireOutlined, TrophyOutlined } from '@ant-design/icons';
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
  leaderboardHref,
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
        <Link href="/learning">
          <Button size="large" block>
            Về Học tập
          </Button>
        </Link>
      </div>
      {showLeaderboard && leaderboardHref ? (
        <p className="drill-run-result__hint">
          <Link
            href={`${leaderboardHref}&refresh=${Date.now()}`}
            className="text-blue-600 hover:underline"
          >
            <TrophyOutlined /> Xem bảng xếp hạng lớp
          </Link>
        </p>
      ) : null}
    </div>
  );
}
