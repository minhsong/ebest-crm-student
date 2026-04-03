'use client';

import { memo } from 'react';
import { Tag } from 'antd';
import { antdTagColorForAttendance } from '@/lib/session-tag-colors';

export type AttendanceCellProps = {
  status: number | null;
  label: string | null;
};

function AttendanceCellInner({ status, label }: AttendanceCellProps) {
  if (status == null) {
    return <span className="text-gray-500">{label ?? 'Chưa điểm danh'}</span>;
  }
  const text = label ?? '—';
  return <Tag color={antdTagColorForAttendance(status)}>{text}</Tag>;
}

export const AttendanceCell = memo(AttendanceCellInner);
