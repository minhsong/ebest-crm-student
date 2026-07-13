'use client';

import { memo } from 'react';

type Props = {
  promptImageUrl: string;
  /** MCQ image giữ eyebrow; Spelling ẩn label minh họa. */
  showEyebrow?: boolean;
};

function ImageMcqPromptInner({ promptImageUrl, showEyebrow = true }: Props) {
  return (
    <>
      {showEyebrow ? (
        <p className="drill-prompt-card__eyebrow">Hình ảnh minh họa</p>
      ) : null}
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
