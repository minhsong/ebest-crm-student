'use client';

import { memo } from 'react';
import { Tag } from 'antd';
import { antdTagColorForClassSessionStatus } from '@/lib/session-tag-colors';

export type SessionStatusTagProps = {
  status?: number;
  label?: string;
};

function SessionStatusTagInner({ status, label }: SessionStatusTagProps) {
  const t = label?.trim();
  if (!t) return <span className="text-gray-400">—</span>;
  const color =
    status != null ? antdTagColorForClassSessionStatus(status) : 'default';
  return <Tag color={color}>{t}</Tag>;
}

export const SessionStatusTag = memo(SessionStatusTagInner);
