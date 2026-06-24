'use client';

import { Card, Space, Tag, Typography, theme } from 'antd';
import { MessageOutlined, TrophyOutlined } from '@ant-design/icons';
import type { StudentAssignmentDetail } from '@/types/student-assignment-detail';

const { Text, Title } = Typography;

type Props = {
  detail: StudentAssignmentDetail;
  /** Gợi ý timeline media — chỉ bài speaking/recording có nhận xét theo đoạn. */
  showMediaTimelineHint?: boolean;
};

/** Điểm + nhận xét chung GV — khi `submissionLocked`. */
export function StudentTeacherFeedbackCard({
  detail,
  showMediaTimelineHint = false,
}: Props) {
  const { token } = theme.useToken();
  const result = detail.result;
  const hasScore =
    result?.scoreDisplay != null && result.scoreDisplay.trim() !== '';
  const hasNote = (result?.teacherNote ?? '').trim().length > 0;
  const hasTags = (result?.assessmentTags?.length ?? 0) > 0;
  const hasSummary = hasScore || hasNote || hasTags;

  return (
    <Card
      size="small"
      style={{
        borderColor: token.colorPrimaryBorder,
        background: token.colorPrimaryBg,
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space align="center" size="small">
          <TrophyOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          <Title level={5} style={{ margin: 0 }}>
            Kết quả chấm bài
          </Title>
        </Space>

        {hasScore ? (
          <div>
            <Text type="secondary">Điểm của bạn</Text>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: token.colorPrimary,
                lineHeight: 1.2,
              }}
            >
              {result!.scoreDisplay}
            </div>
            {detail.scoringTypeLabel ? (
              <Tag style={{ marginTop: 8 }}>{detail.scoringTypeLabel}</Tag>
            ) : null}
          </div>
        ) : !hasSummary ? (
          <Text type="secondary">
            {showMediaTimelineHint
              ? 'Giáo viên đã ghi nhận trên bài nộp. Xem nhận xét chi tiết theo thời gian bên dưới.'
              : 'Giáo viên đã ghi nhận trên bài nộp.'}
          </Text>
        ) : null}

        {hasNote ? (
          <div>
            <Text strong>
              <MessageOutlined /> Nhận xét chung
            </Text>
            <Text style={{ display: 'block', marginTop: 8, whiteSpace: 'pre-wrap' }}>
              {result!.teacherNote}
            </Text>
          </div>
        ) : null}

        {hasTags ? (
          <Space wrap size={[4, 4]}>
            {result!.assessmentTags!.map((t) => (
              <Tag key={t.id} color={t.color}>
                {t.name}
              </Tag>
            ))}
          </Space>
        ) : null}

        {showMediaTimelineHint ? (
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            Nhận xét theo từng đoạn: bấm «Xem nhận xét» trên mỗi bài ghi âm/video.
          </Text>
        ) : null}
      </Space>
    </Card>
  );
}
