'use client';

import { Typography } from 'antd';
import { memo } from 'react';

import type { QuizUnsupportedQuestionBodyProps } from './quiz-question.types';

/** Loại câu chưa có UI tương tác (chỉ stem + nhắc người dùng). */
export const QuizUnsupportedQuestionBody = memo(function QuizUnsupportedQuestionBody({
  message,
}: QuizUnsupportedQuestionBodyProps) {
  return (
    <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
      {message}
    </Typography.Paragraph>
  );
});
