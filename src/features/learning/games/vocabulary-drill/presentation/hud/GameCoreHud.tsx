'use client';

import type { ReactNode } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';

type Props = {
  modeLabel: string;
  title?: string;
  scoreSlot: ReactNode;
  onExitClick: () => void;
};

/** Header shell chung mọi game drill (GE-V4) — nút thoát touch-friendly. */
export function GameCoreHud({ modeLabel, title, scoreSlot, onExitClick }: Props) {
  return (
    <header className="drill-game-hud">
      <button type="button" className="drill-game-hud__exit" onClick={onExitClick}>
        <ArrowLeftOutlined />
        <span>Thoát</span>
      </button>
      <div className="drill-game-hud__center">
        <span className="drill-game-hud__mode">{modeLabel}</span>
        {title ? <span className="drill-game-hud__title">{title}</span> : null}
      </div>
      {scoreSlot}
    </header>
  );
}
