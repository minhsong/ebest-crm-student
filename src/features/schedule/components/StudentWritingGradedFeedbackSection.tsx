'use client';

import { Card, Space, Tag, Typography, theme } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import { looksLikeRichHtml } from '@/lib/rich-html.utils';
import type { StudentAssignmentDetail } from '@/types/student-assignment-detail';

const { Text, Title } = Typography;

type Props = {
  detail: StudentAssignmentDetail;
};

/** Nhận xét GV cho bài viết — hiển thị dưới bài nộp, hỗ trợ HTML. */
export function StudentWritingGradedFeedbackSection({ detail }: Props) {
  const { token } = theme.useToken();
  const result = detail.result;
  const note = (result?.teacherNote ?? '').trim();
  const hasNote = note.length > 0;
  const hasTags = (result?.assessmentTags?.length ?? 0) > 0;

  if (!hasNote && !hasTags) {
    return (
      <Card size="small">
        <Text type="secondary">Giáo viên chưa ghi nhận xét chi tiết.</Text>
      </Card>
    );
  }

  return (
    <Card
      size="small"
      style={{
        borderColor: token.colorPrimaryBorder,
        background: token.colorPrimaryBg,
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={5} style={{ margin: 0 }}>
          <MessageOutlined /> Nhận xét của giáo viên
        </Title>

        {hasNote ? (
          looksLikeRichHtml(note) ? (
            <QaArticleHtml html={note} />
          ) : (
            <Text style={{ display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
              {note}
            </Text>
          )
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
      </Space>
    </Card>
  );
}
