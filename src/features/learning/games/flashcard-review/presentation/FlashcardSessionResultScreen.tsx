'use client';

import Link from 'next/link';
import { Button, Result } from 'antd';

import type { FlashcardReviewPresentationProfile } from '@/features/learning/games/flashcard-review/flashcard-review-presentation.mapper';

type Props = {
  presentation: FlashcardReviewPresentationProfile;
  known: number;
  unknown: number;
  total: number;
  backHref: string;
  practiceHref: string;
};

export function FlashcardSessionResultScreen({
  presentation,
  known,
  unknown,
  total,
  backHref,
  practiceHref,
}: Props) {
  return (
    <Result
      status="success"
      title={presentation.doneTitle}
      subTitle={presentation.doneSubtitleTemplate(known, unknown, total)}
      extra={[
        <Link key="back" href={backHref}>
          <Button type="primary">Về buổi học</Button>
        </Link>,
        <Link key="practice" href={practiceHref}>
          <Button>Games</Button>
        </Link>,
      ]}
    />
  );
}
