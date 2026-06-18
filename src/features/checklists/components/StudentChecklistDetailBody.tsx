'use client';

import { useMemo } from 'react';
import { Button, Descriptions, Space, Tag, Typography, theme } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import type { StudentChecklistDetail } from '@/types/student-checklists';
import { checklistTypeLabel } from '@/lib/checklist-labels';

const { Text } = Typography;

type Props = {
  detail: StudentChecklistDetail;
};

export function StudentChecklistDetailBody({ detail }: Props) {
  const { token } = theme.useToken();
  const isGamePenalty = detail.checklist.typeKey === 'vocab_game_penalty';
  const playHref = useMemo(
    () =>
      `/learning/games?classId=${detail.checklist.classId}&checklistId=${detail.checklist.id}`,
    [detail.checklist.classId, detail.checklist.id],
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space wrap size="small">
          <Tag color={detail.studentItem.checked ? 'green' : 'orange'}>
            {detail.studentItem.checked ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
          </Tag>
          <Tag>{checklistTypeLabel(detail.checklist.typeKey)}</Tag>
          {detail.studentItem.deadlineAt ? (
            <Tag>
              Deadline:{' '}
              {new Date(detail.studentItem.deadlineAt).toLocaleString('vi-VN')}
            </Tag>
          ) : null}
        </Space>
      </div>

      {isGamePenalty && detail.gameProgress ? (
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Yêu cầu">
            Đạt tối thiểu {detail.gameProgress.minimumScore} điểm (lượt cao nhất)
          </Descriptions.Item>
          <Descriptions.Item label="Điểm cao nhất">
            {detail.gameProgress.bestScore} / {detail.gameProgress.minimumScore}
          </Descriptions.Item>
          <Descriptions.Item label="Lượt chơi">
            {detail.gameProgress.playCount}
          </Descriptions.Item>
        </Descriptions>
      ) : null}

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 1 }}
        labelStyle={{ fontWeight: 600, width: 160 }}
      >
        {detail.checklist.note ? (
          <Descriptions.Item label="Ghi chú" span={2}>
            <Text>{detail.checklist.note}</Text>
          </Descriptions.Item>
        ) : null}
        {detail.studentItem.note ? (
          <Descriptions.Item label="Ghi chú riêng" span={2}>
            <Text>{detail.studentItem.note}</Text>
          </Descriptions.Item>
        ) : null}
      </Descriptions>

      {isGamePenalty && !detail.studentItem.checked ? (
        <Link href={playHref}>
          <Button type="primary" size="large" icon={<PlayCircleOutlined />} block>
            Chơi game phạt
          </Button>
        </Link>
      ) : null}

      {detail.studentItem.checkedAt ? (
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          Cập nhật: {new Date(detail.studentItem.checkedAt).toLocaleString('vi-VN')}
          {detail.studentItem.completedVia === 'game_sync'
            ? ' · Tự động qua game'
            : detail.studentItem.completedVia === 'manual'
              ? ' · Giáo viên xác nhận'
              : ''}
        </Text>
      ) : null}
    </Space>
  );
}
