'use client';

import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import { FEEDBACK_COLUMN_CARD_STYLE } from '../media-review-styles';

const { Text } = Typography;

type Props = {
  title: string;
  children: ReactNode;
};

export function FeedbackColumn({ title, children }: Props) {
  return (
    <Card
      size="small"
      title={
        <Text strong style={{ fontSize: 12 }}>
          {title}
        </Text>
      }
      style={FEEDBACK_COLUMN_CARD_STYLE}
      styles={{
        header: { minHeight: 36, padding: '0 10px' },
        body: {
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        },
      }}
    >
      {children}
    </Card>
  );
}
