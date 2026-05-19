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
import { useCallback, useEffect, useRef, useState } from 'react';

// ==================== Types ====================
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

type QuizAttemptConfirmSectionProps = CommonMetaProps & {
  errMsg: string | null;
  rulesAcknowledged: boolean;
  onRulesAcknowledgedChange: (next: boolean) => void;
  onBack: () => void;
  onStart: () => void;
};

type QuizAttemptDoneSectionProps = CommonMetaProps & {
  submitResult: SubmitAttemptResponse;
  attemptHistory: QuizAttemptHistoryItem[];
  onOpenConfirmStart: () => void;
  onRefreshHistory: () => Promise<QuizAttemptHistoryItem[]>;
};

// ==================== Ready Section ====================
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
        {/* Header */}
        <Link href="/quiz-test">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách đề
          </Button>
        </Link>

        {/* Title */}
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

        {/* Form info */}
        <div>
          <Typography.Text strong>Thông tin đề</Typography.Text>
          <div className="mt-2">
            <QuizFormMetaBlock
              formType={formPayload.type ?? null}
              catalogKey={formPayload.catalogKey ?? null}
              catalogPath={formPayload.catalogPath ?? null}
              tagKeys={formTagKeys}
              durationSummary={durationSummary}
            />
          </div>
        </div>

        {/* Instructions */}
        {formPayload.instructions?.trim() ? (
          <div>
            <Typography.Text strong>Hướng dẫn</Typography.Text>
            <div className="mt-2">
              <QaArticleHtml html={formPayload.instructions} />
            </div>
          </div>
        ) : (
          <Typography.Paragraph type="secondary">
            Không có hướng dẫn thêm.
          </Typography.Paragraph>
        )}

        {/* Error message */}
        {errMsg ? <Alert type="error" message={errMsg} /> : null}

        {/* History */}
        <QuizAttemptHistoryList
          formPublicId={formPublicId}
          rows={attemptHistory}
          title="Các lần làm trước"
          description="Bấm từng dòng để xem chi tiết câu trả lời."
        />

        {/* Start button */}
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

// ==================== Confirm Section ====================
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
        {/* Header */}
        <Link href="/quiz-test">
          <Button type="default" icon={<ArrowLeftOutlined />} size="small">
            Danh sách đề
          </Button>
        </Link>

        {/* Title */}
        <Typography.Title level={4} style={{ margin: 0 }}>
          Xác nhận làm bài
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Bạn sắp bắt đầu một phiên làm bài có giới hạn thời gian. Hãy đảm bảo mạng ổn định và không đóng trình duyệt giữa chừng.
        </Typography.Paragraph>

        {/* Rules */}
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

        {/* Form info */}
        <div>
          <Typography.Text strong>Đề</Typography.Text>
          <div className="mt-2">
            <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
              {title}
            </Typography.Title>
            <QuizFormMetaBlock
              formType={formPayload.type ?? null}
              catalogKey={formPayload.catalogKey ?? null}
              catalogPath={formPayload.catalogPath ?? null}
              tagKeys={formTagKeys}
              durationSummary={durationSummary}
            />
          </div>
        </div>

        {/* Acknowledge checkbox */}
        <Checkbox
          checked={rulesAcknowledged}
          onChange={(e) => onRulesAcknowledgedChange(e.target.checked)}
        >
          Tôi đã đọc và đồng ý bắt đầu làm bài trong phạm vi thời gian quy định.
        </Checkbox>

        {/* Error message */}
        {errMsg ? <Alert type="error" message={errMsg} /> : null}

        {/* Action buttons */}
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

// ==================== Done Section ====================
export function QuizAttemptDoneSection({
  title,
  formPublicId,
  formPayload,
  formTagKeys,
  durationSummary,
  submitResult,
  attemptHistory,
  onOpenConfirmStart,
  onRefreshHistory,
}: QuizAttemptDoneSectionProps) {
  const [history, setHistory] = useState<QuizAttemptHistoryItem[]>(attemptHistory);
  const [isReloading, setIsReloading] = useState(false);
  const hasAutoRefreshedRef = useRef(false);

  const isExpired = submitResult.status === 'expired';
  const statusTagColor = getStatusTagColor(submitResult.status);
  const scoreSummary = getScoreSummary(submitResult.grading);

  // Sync history when prop changes (from parent refresh)
  useEffect(() => {
    setHistory(attemptHistory);
  }, [attemptHistory]);

  // Auto-refresh history on mount (after submit)
  useEffect(() => {
    if (hasAutoRefreshedRef.current) return;
    hasAutoRefreshedRef.current = true;
    void onRefreshHistory().then((newHistory) => {
      if (newHistory.length > 0) {
        setHistory(newHistory);
      }
    });
  }, [onRefreshHistory]);

  const handleReload = useCallback(async () => {
    if (isReloading) return;
    setIsReloading(true);
    try {
      const newHistory = await onRefreshHistory();
      setHistory(newHistory);
    } finally {
      setIsReloading(false);
    }
  }, [isReloading, onRefreshHistory]);

  // Determine latest attempt ID for highlighting
  const latestAttemptId = history[0]?.attemptPublicId ?? null;

  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/quiz-test">
            <Button type="default" icon={<ArrowLeftOutlined />} size="small">
              Danh sách đề
            </Button>
          </Link>
          <Button
            type="text"
            icon={<span className={`${isReloading ? 'animate-spin' : ''}`}>↻</span>}
            onClick={handleReload}
            loading={isReloading}
            size="small"
            title="Tải lại danh sách bài làm"
          >
            {isReloading ? 'Đang tải...' : 'Tải lại'}
          </Button>
        </div>

        {/* Title & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Chi tiết bài làm
          </Typography.Title>
          <Tag color={statusTagColor}>{isExpired ? 'Hết giờ' : 'Đã nộp bài'}</Tag>
        </div>

        {/* Quiz title */}
        <Typography.Title level={5} type="secondary" style={{ margin: 0 }}>
          {title}
        </Typography.Title>

        {/* Form info */}
        <QuizFormMetaBlock
          formType={formPayload.type ?? null}
          catalogKey={formPayload.catalogKey ?? null}
          catalogPath={formPayload.catalogPath ?? null}
          tagKeys={formTagKeys}
          durationSummary={durationSummary}
        />

        {/* Score summary */}
        {scoreSummary ? (
          <Typography.Paragraph style={{ marginBottom: 0, marginTop: 4 }}>
            Kết quả: <strong>{scoreSummary.correct}</strong> /{' '}
            <strong>{scoreSummary.total}</strong> câu đúng.
          </Typography.Paragraph>
        ) : null}

        <Divider style={{ margin: '8px 0' }} />

        {/* History with highlight for current/latest attempt */}
        <QuizAttemptHistoryList
          formPublicId={formPublicId}
          rows={history}
          title="Các bài đã làm"
          vertical
          showScore
          highlightAttemptId={latestAttemptId}
          onRefresh={onRefreshHistory}
        />

        {/* Action buttons */}
        <Space wrap>
          <Button color="green" variant="solid" onClick={onOpenConfirmStart}>
            Làm bài mới
          </Button>
          <Link href={`/quiz-test/${formPublicId}/attempts`}>
            <Button type="default">Các lần làm khác</Button>
          </Link>
        </Space>
      </Space>
    </Card>
  );
}
