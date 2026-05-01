'use client';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { QaArticleHtml } from '@/features/qa/components/QaArticleHtml';
import { QuizAttemptHistoryList } from '@/features/quiz-test/components/QuizAttemptHistoryList';
import { QuizFormMetaBlock } from '@/features/quiz-test/components/QuizFormMetaBlock';
import {
  getScoreSummary,
  getStatusTagColor,
} from '@/features/quiz-test/lib/quiz-runtime-view';
import type {
  QuizAttemptHistoryItem,
  QuizPublishedFormPayload,
  SubmitAttemptResponse,
} from '@/features/quiz-test/types';
import { Alert, Button, Card, Checkbox, Divider, Space, Tag, Typography } from 'antd';
import Link from 'next/link';

type CommonMetaProps = {
  title: string;
  formPublicId: string;
  formPayload: QuizPublishedFormPayload;
  formTagKeys: string[];
  durationSummary: string;
};

type QuizAttemptReadySectionProps = CommonMetaProps & {
  errMsg: string | null;
  attemptHistory: QuizAttemptHistoryItem[];
  onOpenConfirmStart: () => void;
};

export function QuizAttemptReadySection({
  title,
  formPublicId,
  formPayload,
  formTagKeys,
  durationSummary,
  errMsg,
  attemptHistory,
  onOpenConfirmStart,
}: QuizAttemptReadySectionProps) {
  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full max-w-3xl">
        <Link href="/quiz-test">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách đề
          </Button>
        </Link>

        <div>
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Chi tiết đề thi · trước khi vào làm bài
          </Typography.Text>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
        </div>

        <div>
          <Typography.Text strong>Thông tin đề</Typography.Text>
          <div className="mt-2">
            <QuizFormMetaBlock
              formType={formPayload.type ?? null}
              catalogKey={formPayload.catalogKey ?? null}
              tagKeys={formTagKeys}
              durationSummary={durationSummary}
            />
          </div>
        </div>

        {formPayload.instructions?.trim() ? (
          <div>
            <Typography.Text strong>Hướng dẫn</Typography.Text>
            <div className="mt-2">
              <QaArticleHtml html={formPayload.instructions} />
            </div>
          </div>
        ) : (
          <Typography.Paragraph type="secondary">Không có hướng dẫn thêm.</Typography.Paragraph>
        )}

        {errMsg ? <Alert type="error" message={errMsg} /> : null}

        <QuizAttemptHistoryList
          formPublicId={formPublicId}
          rows={attemptHistory}
          title="Các lần làm trước"
          description="Bấm từng dòng để xem chi tiết câu trả lời."
        />

        <Space>
          {attemptHistory.length > 0 ? (
            <Button color="green" variant="solid" size="large" onClick={onOpenConfirmStart}>
              Làm bài mới
            </Button>
          ) : (
            <Button type="primary" size="large" onClick={onOpenConfirmStart}>
              Bắt đầu làm bài
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  );
}

type QuizAttemptConfirmSectionProps = CommonMetaProps & {
  errMsg: string | null;
  rulesAcknowledged: boolean;
  onRulesAcknowledgedChange: (next: boolean) => void;
  onBack: () => void;
  onStart: () => void;
};

export function QuizAttemptConfirmSection({
  title,
  formPayload,
  formTagKeys,
  durationSummary,
  errMsg,
  rulesAcknowledged,
  onRulesAcknowledgedChange,
  onBack,
  onStart,
}: QuizAttemptConfirmSectionProps) {
  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full max-w-3xl">
        <Link href="/quiz-test">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách đề
          </Button>
        </Link>

        <Typography.Title level={4} style={{ margin: 0 }}>
          Xác nhận làm bài
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Bạn sắp bắt đầu một phiên làm bài có giới hạn thời gian. Hãy đảm bảo mạng ổn định và
          không đóng trình duyệt giữa chừng.
        </Typography.Paragraph>

        <Alert
          type="info"
          showIcon
          message="Quy định & lưu ý (có thể bổ sung sau)"
          description={
            <ul className="mb-0 list-disc pl-5">
              <li>Làm bài trung thực, không gian lận.</li>
              <li>Hết thời gian hệ thống có thể tự nộp bài.</li>
              <li>Câu trả lời được lưu nháp theo từng thao tác (khi kết nối cho phép).</li>
            </ul>
          }
        />

        <div>
          <Typography.Text strong>Đề</Typography.Text>
          <div className="mt-2">
            <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
              {title}
            </Typography.Title>
            <QuizFormMetaBlock
              formType={formPayload.type ?? null}
              catalogKey={formPayload.catalogKey ?? null}
              tagKeys={formTagKeys}
              durationSummary={durationSummary}
            />
          </div>
        </div>

        <Checkbox
          checked={rulesAcknowledged}
          onChange={(e) => onRulesAcknowledgedChange(e.target.checked)}
        >
          Tôi đã đọc và đồng ý bắt đầu làm bài trong phạm vi thời gian quy định.
        </Checkbox>

        {errMsg ? <Alert type="error" message={errMsg} /> : null}

        <Space wrap>
          <Button onClick={onBack}>Quay lại</Button>
          <Button type="primary" size="large" disabled={!rulesAcknowledged} onClick={onStart}>
            Xác nhận và bắt đầu làm bài
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

type QuizAttemptDoneSectionProps = CommonMetaProps & {
  submitResult: SubmitAttemptResponse;
  attemptHistory: QuizAttemptHistoryItem[];
  onOpenConfirmStart: () => void;
};

export function QuizAttemptDoneSection({
  title,
  formPublicId,
  formPayload,
  formTagKeys,
  durationSummary,
  submitResult,
  attemptHistory,
  onOpenConfirmStart,
}: QuizAttemptDoneSectionProps) {
  const isExpired = submitResult.status === 'expired';
  const statusTagColor = getStatusTagColor(submitResult.status);
  const scoreSummary = getScoreSummary(submitResult.grading);

  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        <Link href="/quiz-test">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách đề
          </Button>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Chi tiết bài làm
          </Typography.Title>
          <Tag color={statusTagColor}>{isExpired ? 'Hết giờ' : 'Đã nộp bài'}</Tag>
        </div>
        <Typography.Title level={5} type="secondary" style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        <QuizFormMetaBlock
          formType={formPayload.type ?? null}
          catalogKey={formPayload.catalogKey ?? null}
          tagKeys={formTagKeys}
          durationSummary={durationSummary}
        />
        {scoreSummary ? (
          <Typography.Paragraph style={{ marginBottom: 0, marginTop: 4 }}>
            Kết quả: <strong>{scoreSummary.correct}</strong> / <strong>{scoreSummary.total}</strong>{' '}
            câu đúng.
          </Typography.Paragraph>
        ) : null}
        <Divider style={{ margin: '8px 0' }} />
        <QuizAttemptHistoryList
          formPublicId={formPublicId}
          rows={attemptHistory}
          title="Các bài đã làm"
          vertical
          showScore
        />
        <Space wrap>
          <Button color="green" variant="solid" onClick={onOpenConfirmStart}>
            Làm bài mới
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
