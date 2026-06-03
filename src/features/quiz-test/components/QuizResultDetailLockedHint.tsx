'use client';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';

import {
  describeQuizResultDetailLocked,
  QUIZ_RESULT_DETAIL_LOCKED_SHORT_LABEL,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';

type Props = {
  eligibility?: QuizResultEligibility | null;
  /** Tooltip tùy chỉnh — mặc định derive từ eligibility. */
  tooltip?: string;
  /** false khi màn đã có QuizAttemptQuotaSummary (tránh lặp quota trong tooltip). */
  includeQuotaInTooltip?: boolean;
  className?: string;
};

/** Nhãn ngắn + icon ? — chi tiết điều kiện xem đáp án trong tooltip. */
export function QuizResultDetailLockedHint({
  eligibility,
  tooltip,
  includeQuotaInTooltip = true,
  className,
}: Props) {
  const tip =
    tooltip ??
    describeQuizResultDetailLocked(eligibility, {
      includeQuota: includeQuotaInTooltip,
    });

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      <Typography.Text type="secondary" className="text-sm mb-0">
        {QUIZ_RESULT_DETAIL_LOCKED_SHORT_LABEL}
      </Typography.Text>
      <Tooltip
        title={tip}
        placement="topLeft"
        styles={{ root: { maxWidth: 420 } }}
      >
        <QuestionCircleOutlined
          className="text-[var(--ant-color-text-description)] cursor-help text-sm"
          aria-label="Giải thích điều kiện xem chi tiết đáp án"
        />
      </Tooltip>
    </span>
  );
}
