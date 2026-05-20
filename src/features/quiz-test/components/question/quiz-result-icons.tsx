'use client';

import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

const CORRECT_COLOR = '#16a34a';
const WRONG_COLOR = '#dc2626';

type IconProps = {
  size?: number;
  className?: string;
  'aria-label'?: string;
};

/** Icon ✓ xanh — không phụ thuộc currentColor của ant Radio/Checkbox */
export function QuizResultCorrectIcon({
  size = 18,
  className,
  'aria-label': ariaLabel,
}: IconProps) {
  return (
    <span className={`inline-flex ${className ?? ''}`} role="img" aria-label={ariaLabel}>
      <CheckCircleFilled style={{ color: CORRECT_COLOR, fontSize: size }} />
    </span>
  );
}

/** Icon ✗ đỏ */
export function QuizResultWrongIcon({
  size = 18,
  className,
  'aria-label': ariaLabel,
}: IconProps) {
  return (
    <span className={`inline-flex ${className ?? ''}`} role="img" aria-label={ariaLabel}>
      <CloseCircleFilled style={{ color: WRONG_COLOR, fontSize: size }} />
    </span>
  );
}
