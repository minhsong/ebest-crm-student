'use client';

import { Alert, Button } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { VocabularyDrillLobbyViewModel } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-lobby.mapper';

type Props = {
  vm: VocabularyDrillLobbyViewModel;
  canStart: boolean;
  startBlockReason?: string | null;
  onStart: () => void;
};

export function AssignmentLobbyHero({ vm, canStart, startBlockReason, onStart }: Props) {
  return (
    <div className="drill-lobby-hero">
      <p className="drill-lobby-hero__eyebrow">{vm.eyebrow}</p>
      <h2 className="drill-lobby-hero__title">{vm.title}</h2>
      <p className="drill-lobby-hero__desc">{vm.description}</p>
      {vm.stats.length > 0 ? (
        <div className="drill-lobby-hero__stats">
          {vm.stats.map((stat) => (
            <div key={stat.label} className="drill-lobby-stat">
              <span className="drill-lobby-stat__value">{stat.value}</span>
              <span className="drill-lobby-stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {vm.footerHint ? (
        <p className="drill-lobby-hero__desc mt-3 mb-0 text-sm opacity-80">{vm.footerHint}</p>
      ) : null}
      {!canStart && startBlockReason ? (
        <Alert className="mt-4" type="warning" showIcon message={startBlockReason} />
      ) : null}
      <Button
        type="primary"
        size="large"
        icon={<ThunderboltOutlined />}
        className="drill-lobby-cta mt-5"
        disabled={!canStart}
        onClick={onStart}
      >
        {vm.ctaLabel}
      </Button>
    </div>
  );
}
