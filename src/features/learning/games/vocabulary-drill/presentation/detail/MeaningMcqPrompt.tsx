'use client';

import { memo } from 'react';

type Props = {
  prompt: string;
};

function MeaningMcqPromptInner({ prompt }: Props) {
  return (
    <>
      <p className="drill-prompt-card__eyebrow">Nghĩa tiếng Việt</p>
      <p className="drill-prompt-card__text">{prompt}</p>
    </>
  );
}

export const MeaningMcqPrompt = memo(MeaningMcqPromptInner);
