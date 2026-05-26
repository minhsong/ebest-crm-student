'use client';

import { Flex, Grid, Tag, Tooltip, Typography, theme } from 'antd';
import type { AssignmentOverviewRow } from '@/lib/assignments-overview-grouping';
import {
  assignmentResultShort,
  assignmentResultTagColor,
  assignmentTypeIcon,
  assignmentTypeShort,
} from '@/lib/assignment-quiz-ui';
import { formatAssignmentDeadlineVi } from '@/features/quiz-test/lib/quiz-assignment-overview';

const { Text, Link } = Typography;

type Props = {
  row: AssignmentOverviewRow;
  onOpenDetail: () => void;
};

/**
 * Một dòng bài tập: icon loại (tooltip) · tên (click) · hạn · trạng thái · điểm (click).
 */
export function AssignmentOverviewListRow({ row, onOpenDetail }: Props) {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();

  const typeLabel = assignmentTypeShort(row.exerciseType);
  const icon = assignmentTypeIcon(row.exerciseType);
  const deadlineText = formatAssignmentDeadlineVi(row.deadline);
  const scoreText = row.scoreDisplay?.trim() || '—';
  const title = row.title?.trim() || 'Bài tập';
  const statusLabel = assignmentResultShort(row.resultStatus);

  const iconBoxStyle = {
    width: 32,
    height: 32,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillTertiary,
    flexShrink: 0,
    fontSize: token.fontSizeLG,
    color: token.colorTextSecondary,
  } as const;

  return (
    <Flex
      align="center"
      gap={token.marginSM}
      style={{ width: '100%', minWidth: 0 }}
    >
      <Tooltip title={typeLabel}>
        <Flex align="center" justify="center" style={iconBoxStyle} aria-label={typeLabel}>
          {icon}
        </Flex>
      </Tooltip>

      <Link
        onClick={onOpenDetail}
        ellipsis
        style={{ flex: '1 1 auto', minWidth: 0, margin: 0 }}
        title={title}
      >
        {title}
      </Link>

      {deadlineText && screens.lg ? (
        <Text
          type="secondary"
          style={{ fontSize: token.fontSizeSM, flexShrink: 0 }}
          ellipsis
        >
          Hạn {deadlineText}
        </Text>
      ) : null}

      <Tag
        color={assignmentResultTagColor(row.resultStatus)}
        style={{ margin: 0, flexShrink: 0, fontSize: token.fontSizeSM }}
      >
        {statusLabel}
      </Tag>

      <Link
        strong
        onClick={onOpenDetail}
        style={{
          flexShrink: 0,
          minWidth: 40,
          textAlign: 'right',
          margin: 0,
        }}
        title="Xem chi tiết bài làm"
      >
        {scoreText}
      </Link>
    </Flex>
  );
}
