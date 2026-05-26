'use client';

import { CalendarOutlined } from '@ant-design/icons';
import { Card, Flex, List, Typography, theme } from 'antd';
import type { SessionAssignmentGroup } from '@/lib/assignments-overview-grouping';
import { AssignmentOverviewListRow } from '@/features/assignments/components/AssignmentOverviewListRow';

const { Text } = Typography;

type Props = {
  session: SessionAssignmentGroup;
  onOpenAssignment: (assignmentId: number) => void;
};

function formatSessionDate(scheduledDate: string): string | null {
  const raw = scheduledDate?.trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function SessionAssignmentsCard({ session, onOpenAssignment }: Props) {
  const { token } = theme.useToken();
  const dateLabel = formatSessionDate(session.scheduledDate);
  const assignmentCount = session.assignments.length;

  return (
    <Card
      size="small"
      styles={{
        header: {
          minHeight: 44,
          padding: `${token.paddingSM}px ${token.padding}px`,
        },
        body: { padding: `${token.paddingXXS}px 0 0` },
      }}
      title={
        <Flex align="baseline" wrap="wrap" gap={token.marginXS}>
          <Text strong style={{ fontSize: token.fontSize }}>
            {session.sessionTitle}
          </Text>
          {dateLabel ? (
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              <CalendarOutlined style={{ marginRight: token.marginXXS }} aria-hidden />
              {dateLabel}
            </Text>
          ) : null}
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            · {assignmentCount} bài
          </Text>
        </Flex>
      }
    >
      <List
        size="small"
        split
        dataSource={session.assignments}
        rowKey="assignmentId"
        renderItem={(row) => (
          <List.Item
            style={{
              paddingInline: token.padding,
              paddingBlock: token.paddingXS,
            }}
          >
            <AssignmentOverviewListRow
              row={row}
              onOpenDetail={() => onOpenAssignment(row.assignmentId)}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
