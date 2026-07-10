'use client';

import { memo } from 'react';

type Props = {
  prompt: string;
};

function WordStemMcqPromptInner({ prompt }: Props) {
  return (
    <>
      <p className="drill-prompt-card__eyebrow">Từ tiếng Anh</p>
      <p className="drill-prompt-card__text">{prompt}</p>
    </>
  );
}

export const WordStemMcqPrompt = memo(WordStemMcqPromptInner);
