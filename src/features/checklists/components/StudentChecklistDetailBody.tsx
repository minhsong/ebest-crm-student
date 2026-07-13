'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button, Descriptions, Space, Tag, Typography, theme } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import {
	buildChecklistGameReadyHref,
	parseChecklistGameConfig,
} from '@/features/learning/games/vocabulary-drill/checklist-game-config.util';
import {
	formatGamePromptTypeLabel,
	formatSpellingDifficultyLabel,
} from '@/features/learning/games/vocabulary-drill/game-config-labels';
import type { StudentChecklistDetail } from '@/types/student-checklists';
import { checklistTypeLabel } from '@/lib/checklist-labels';

const { Text } = Typography;

type Props = {
  detail: StudentChecklistDetail;
};

export function StudentChecklistDetailBody({ detail }: Props) {
  const { token } = theme.useToken();
  const isGamePenalty = detail.checklist.typeKey === 'vocab_game_penalty';
  const gameConfig = parseChecklistGameConfig(detail.checklist.gameConfig ?? null);
  const playHref = useMemo(
    () =>
      buildChecklistGameReadyHref(
        detail.checklist.classId,
        detail.checklist.id,
        detail.checklist.gameConfig ?? null,
      ),
    [detail.checklist.classId, detail.checklist.id, detail.checklist.gameConfig],
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
          {gameConfig ? (
            <>
              <Descriptions.Item label="Loại game">
                {formatGamePromptTypeLabel(gameConfig.promptType)}
              </Descriptions.Item>
              {gameConfig.promptType === 'spelling' &&
              formatSpellingDifficultyLabel(gameConfig.spellingDifficulty) ? (
                <Descriptions.Item label="Độ khó">
                  {formatSpellingDifficultyLabel(gameConfig.spellingDifficulty)}
                </Descriptions.Item>
              ) : null}
            </>
          ) : null}
          <Descriptions.Item label="Nhiệm vụ">
            Trả lời đúng ít nhất {detail.gameProgress.minimumScore} từ trong một lượt chơi
          </Descriptions.Item>
          <Descriptions.Item label="Kết quả tốt nhất">
            {detail.gameProgress.bestScore} từ đúng (cần {detail.gameProgress.minimumScore})
          </Descriptions.Item>
          <Descriptions.Item label="Số lần đã chơi">
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
            Bắt đầu làm nhiệm vụ
          </Button>
        </Link>
      ) : null}

      {detail.studentItem.checkedAt ? (
        <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
          Hoàn thành lúc: {new Date(detail.studentItem.checkedAt).toLocaleString('vi-VN')}
          {detail.studentItem.completedVia === 'game_sync'
            ? ' · Qua game luyện từ'
            : detail.studentItem.completedVia === 'manual'
              ? ' · Cô xác nhận'
              : ''}
        </Text>
      ) : null}
    </Space>
  );
}
