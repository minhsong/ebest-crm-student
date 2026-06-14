'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';

type Props = {
  modeLabel: string;
  title?: string;
  backHref: string;
  scoreSlot: ReactNode;
};

/** Header shell chung mọi game drill (GE-V4). */
export function GameCoreHud({ modeLabel, title, backHref, scoreSlot }: Props) {
  return (
    <header className="drill-game-hud">
      <Link href={backHref} className="drill-game-hud__exit">
        <ArrowLeftOutlined />
        <span className="hidden sm:inline">Thoát</span>
      </Link>
      <div className="drill-game-hud__center">
        <span className="drill-game-hud__mode">{modeLabel}</span>
        {title ? <span className="drill-game-hud__title">{title}</span> : null}
      </div>
      {scoreSlot}
    </header>
  );
}
