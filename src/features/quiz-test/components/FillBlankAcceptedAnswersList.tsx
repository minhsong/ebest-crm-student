'use client';

import { CheckCircleFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import {
  FILL_BLANK_ACCEPTED_ROW_CLASS,
  FILL_BLANK_CORRECT_ANSWERS_LABEL,
  nonEmptyTrimmedTexts,
} from '@/features/quiz-test/lib/fill-blank-result-display';

const { Text } = Typography;

export type FillBlankAcceptedAnswersListProps = {
  texts: readonly string[];
  listClassName?: string;
  renderExtra?: (text: string) => React.ReactNode;
};

export function FillBlankAcceptedAnswersList({
  texts,
  listClassName = 'space-y-1',
  renderExtra,
}: FillBlankAcceptedAnswersListProps) {
  const rows = nonEmptyTrimmedTexts(texts);
  if (!rows.length) return null;

  return (
    <div className={listClassName}>
      <div className="text-xs font-medium text-[#389e0d]">
        {FILL_BLANK_CORRECT_ANSWERS_LABEL}
      </div>
      {rows.map((text) => (
        <div key={text} className={FILL_BLANK_ACCEPTED_ROW_CLASS}>
          <div className="flex-1 min-w-0">
            <Text className="text-sm">{text}</Text>
            {renderExtra?.(text)}
          </div>
          <CheckCircleFilled
            className="shrink-0 text-[#52c41a] text-base"
            aria-label="Đáp án chấp nhận"
          />
        </div>
      ))}
    </div>
  );
}
