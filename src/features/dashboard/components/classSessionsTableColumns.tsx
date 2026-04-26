'use client';

import type { ColumnsType } from 'antd/es/table';
import { Flex, Space, Tag, Typography } from 'antd';
import type { OverviewSessionRow } from '@/types/overview-sessions';
import { formatSessionTimeShort } from '@/lib/session-format';
import { CRM_ASSIGNMENT_RESULT_STATUS } from '@/lib/crm-enums';
import { SessionStatusTag } from '@/features/dashboard/components/SessionStatusTag';
import { AttendanceCell } from '@/features/dashboard/components/AttendanceCell';

const { Text } = Typography;

function assignmentResultLabel(resultStatus: number | null): string {
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED) return 'Đã chấm';
  if (resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.SUBMITTED) return 'Đã nộp';
  return 'Chưa nộp';
}

export function getClassSessionsTableColumns(): ColumnsType<OverviewSessionRow> {
  return [
    {
      title: 'Ngày học',
      key: 'date',
      width: 120,
      render: (_, row) => (
        <span>
          {new Date(row.scheduledDate).toLocaleDateString('vi-VN')}
          <br />
          <span className="text-xs text-gray-500">
            {formatSessionTimeShort(row.scheduledStartTime)} –{' '}
            {formatSessionTimeShort(row.scheduledEndTime)}
          </span>
        </span>
      ),
    },
    {
      title: 'Bài học',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (v: string, row) => (
        <Flex gap={8} align="center" wrap="wrap">
          <Text style={{ maxWidth: 260 }} ellipsis>
            {v || 'Buổi học'}
          </Text>
          <Tag
            color={row.isTutoringSession ? 'magenta' : 'blue'}
            className="m-0"
          >
            {row.isTutoringSession ? 'Buổi kèm' : 'Chính thức'}
          </Tag>
        </Flex>
      ),
    },
    {
      title: 'Trạng thái buổi',
      key: 'sessionStatus',
      width: 120,
      render: (_, row) => (
        <SessionStatusTag
          status={row.sessionStatus}
          label={row.sessionStatusLabel}
        />
      ),
    },
    {
      title: 'Giáo viên & trợ giảng',
      key: 'teachers',
      width: 220,
      render: (_, row) => {
        const assistants = row.assistantTeachers?.length
          ? row.assistantTeachers
          : [];
        return (
          <Flex vertical gap={6}>
            {row.teacherDisplayName?.trim() ? (
              row.teacherTagColor ? (
                <Tag color={row.teacherTagColor} style={{ margin: 0 }}>
                  {row.teacherDisplayName.trim()}
                </Tag>
              ) : (
                <Text style={{ fontSize: 13 }}>{row.teacherDisplayName.trim()}</Text>
              )
            ) : (
              <Text type="secondary">—</Text>
            )}
            {assistants.length > 0 ? (
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                  Trợ giảng
                </Text>
                <Flex wrap gap={4}>
                  {assistants.map((a, idx) => (
                    <Tag
                      key={`${a.displayName}-${idx}`}
                      color={a.tagColor}
                      style={{ margin: 0 }}
                    >
                      {a.displayName}
                    </Tag>
                  ))}
                </Flex>
              </Space>
            ) : null}
          </Flex>
        );
      },
    },
    {
      title: 'Phòng học',
      dataIndex: 'classroomName',
      key: 'classroomName',
      width: 140,
      render: (_, row) =>
        row.classroomTagColor != null ? (
          <Tag color={row.classroomTagColor} style={{ margin: 0 }}>
            {row.classroomName?.trim() || 'Phòng học'}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Điểm danh',
      key: 'attendance',
      width: 120,
      render: (_, row) => (
        <AttendanceCell
          status={row.attendanceStatus}
          label={row.attendanceLabel}
        />
      ),
    },
    {
      title: 'Bài tập',
      key: 'assignments',
      width: 260,
      render: (_, row) => {
        const list = row.assignments ?? [];
        if (list.length === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="space-y-1.5 text-sm">
            {list.map((a) => (
              <div
                key={a.assignmentId}
                className="rounded border border-gray-100 bg-gray-50/80 px-2 py-1.5"
              >
                <div className="font-medium text-gray-800">
                  {a.title || 'Bài tập'}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <Tag
                    color={
                      a.resultStatus === CRM_ASSIGNMENT_RESULT_STATUS.GRADED
                        ? 'blue'
                        : 'default'
                    }
                    className="m-0"
                  >
                    {assignmentResultLabel(a.resultStatus)}
                  </Tag>
                  {a.scoreDisplay != null && a.scoreDisplay !== '' && (
                    <span className="text-gray-700">
                      Điểm: <strong>{a.scoreDisplay}</strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
  ];
}
