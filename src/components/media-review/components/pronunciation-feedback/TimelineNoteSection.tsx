'use client';

import { Typography } from 'antd';
import { formatMs } from '../../media-review-utils';

const { Text } = Typography;

type Props = {
  startMs: number;
  noteText: string;
  showDivider: boolean;
};

export function TimelineNoteSection({ startMs, noteText, showDivider }: Props) {
  return (
    <div
      style={{
        flexShrink: 0,
        paddingBottom: showDivider ? 10 : 0,
        borderBottom: showDivider ? '1px solid #f0f0f0' : undefined,
      }}
    >
      <Text
        code
        style={{
          display: 'block',
          marginBottom: noteText ? 8 : 0,
          fontSize: 14,
          fontWeight: 600,
          color: '#0958d9',
        }}
      >
        {formatMs(startMs)}
      </Text>
      {noteText ? (
        <Text style={{ fontSize: 13, whiteSpace: 'pre-wrap', display: 'block' }}>
          {noteText}
        </Text>
      ) : null}
    </div>
  );
}
