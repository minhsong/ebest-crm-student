'use client';

import { memo } from 'react';

type Props = {
  promptImageUrl: string;
};

function ImageMcqPromptInner({ promptImageUrl }: Props) {
  return (
    <>
      <p className="drill-prompt-card__eyebrow">Hình ảnh minh họa</p>
      <div className="drill-prompt-card__image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={promptImageUrl}
          alt="Hình minh họa từ vựng"
          className="drill-prompt-card__image"
        />
      </div>
    </>
  );
}

export const ImageMcqPrompt = memo(ImageMcqPromptInner);
