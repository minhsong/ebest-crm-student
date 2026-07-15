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
import {
  formHasAutoPlaybackListeningSection,
  formHasOnDemandPlaybackListeningSection,
} from '@/features/quiz-test/lib/quiz-listening-rules';
import { unlockQuizAudioSession } from '@/features/quiz-test/lib/quiz-audio-session';
import { Alert, Button, Card, Checkbox, Divider, InputNumber, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QuizAttemptQuotaSummary } from '@/features/quiz-test/components/QuizAttemptQuotaSummary';
import {
  hasPriorQuizAttemptsForUi,
} from '@/features/quiz-test/lib/quiz-attempt-history';
import {
  describeQuizResultDetailLocked,
  type QuizResultEligibility,
} from '@/features/quiz-test/lib/quiz-result-view-policy';
import { MockTestOnlineSpeakerTest } from '@/components/public-mock-test-online/MockTestOnlineSpeakerTest';
import {
  normalizeExamExpectedScore,
  resolveExamExpectedScoreScale,
} from '@/lib/public-mock-test-online/exam-expected-score.util';

// ==================== Types ====================
type CommonMetaProps = {
  title: string;
  formPublicId: string;
  formPayload: QuizPublishedFormPayload;
  formTagKeys: string[];
  durationSummary: string;
  /** Quay lại danh sách bài tập hoặc ôn luyện */
  backHref?: string;
};

type QuizAttemptReadySectionProps = CommonMetaProps & {
  errMsg: string | null;
  attemptHistory: QuizAttemptHistoryItem[];
  onOpenConfirmStart: () => void;
  assignmentId?: number;
  canStartNew?: boolean;
  resultsPageHref?: string | null;
  startBlockReason?: string | null;
  allowHistoryDetailLinks?: boolean;
  eligibility?: QuizResultEligibility | null;
  /** Thi thử online public — UI gọn, ẩn lịch sử / quay lại. */
  mockTestOnlineUi?: boolean;
};

type QuizAttemptConfirmSectionProps = CommonMetaProps & {
  errMsg: string | null;
  rulesAcknowledged: boolean;
  onRulesAcknowledgedChange: (next: boolean) => void;
  onBack: () => void;
  onStart: (opts?: { expectedScore?: number | null }) => void;
  mockTestOnlineUi?: boolean;
  expectedScore?: number | null;
  onExpectedScoreChange?: (next: number | null) => void;
  speakerChecked?: boolean;
  onSpeakerCheckedChange?: (next: boolean) => void;
};

type QuizAttemptDoneSectionProps = CommonMetaProps & {
  submitResult: SubmitAttemptResponse;
  attemptHistory: QuizAttemptHistoryItem[];
  onOpenConfirmStart: () => void;
  onRefreshHistory: () => Promise<QuizAttemptHistoryItem[]>;
  assignmentId?: number;
  canStartNew?: boolean;
  resultsPageHref?: string | null;
  allowHistoryDetailLinks?: boolean;
  eligibility?: QuizResultEligibility | null;
};

// ==================== Ready Section ====================
export function QuizAttemptReadySection({
  title,
  formPublicId,
  formPayload,
  formTagKeys,
  durationSummary,
  backHref,
  errMsg,
  attemptHistory,
  onOpenConfirmStart,
  assignmentId,
  canStartNew = true,
  resultsPageHref,
  startBlockReason,
  allowHistoryDetailLinks = true,
  eligibility,
  mockTestOnlineUi = false,
}: QuizAttemptReadySectionProps) {
  const detailAnswersLockedHint = allowHistoryDetailLinks
    ? null
    : describeQuizResultDetailLocked(eligibility);

  return (
    <Card bordered={mockTestOnlineUi ? false : undefined}>
      <Space direction="vertical" size="middle" className="w-full max-w-3xl">
        {!mockTestOnlineUi ? (
          <Link href={backHref ?? '/assignments'}>
            <Button type="default" icon={<ArrowLeftOutlined />} size="small">
              Quay lại
            </Button>
          </Link>
        ) : null}

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
            {mockTestOnlineUi ? 'Sẵn sàng làm bài' : 'Chi tiết đề thi · trước khi vào làm bài'}
          </Typography.Text>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
        </div>

        <div>
          <Typography.Text strong>
            {mockTestOnlineUi ? 'Thông tin bài thi' : 'Thông tin đề'}
          </Typography.Text>
          <div className="mt-2">
            <QuizFormMetaBlock
              formType={formPayload.type ?? null}
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
        ) : mockTestOnlineUi ? (
          <Typography.Paragraph type="secondary" className="!mb-0">
            Đọc kỹ hướng dẫn trên màn hình làm bài. Giữ tab mở và đảm bảo kết nối mạng ổn
            định.
          </Typography.Paragraph>
        ) : (
          <Typography.Paragraph type="secondary">
            Không có hướng dẫn thêm.
          </Typography.Paragraph>
        )}

        {mockTestOnlineUi ? (
          <Alert
            type="info"
            showIcon
            message="Chuẩn bị trước khi làm bài"
            description={
              <ul className="mb-0 list-disc pl-5">
                <li>Chỗ yên tĩnh, điện thoại đủ pin, kết nối mạng ổn định.</li>
                <li>
                  Nếu bài có phần nghe: chuẩn bị tai nghe/loa và kiểm tra âm thanh ở bước
                  xác nhận.
                </li>
                <li>Không đóng / tải lại trang khi đang làm bài.</li>
                <li>
                  Mỗi lần thi bạn sẽ nhập điểm kỳ vọng riêng để đối chiếu với kết quả sau
                  khi nộp.
                </li>
              </ul>
            }
          />
        ) : null}

        {errMsg ? <Alert type="error" message={errMsg} /> : null}

        {!mockTestOnlineUi ? (
          <>
            <QuizAttemptQuotaSummary eligibility={eligibility} />

            {!canStartNew && startBlockReason ? (
              <Alert type="info" showIcon message={startBlockReason} />
            ) : null}

            <QuizAttemptHistoryList
              formPublicId={formPublicId}
              rows={attemptHistory}
              title="Các lần làm trước"
              description={
                allowHistoryDetailLinks
                  ? 'Bấm từng lần làm để xem thông tin và kết quả bài của bạn.'
                  : 'Danh sách các lần đã nộp. Chi tiết đáp án mở khi hết lượt hoặc đạt 100%.'
              }
              showScore
              allowDetailLinks={allowHistoryDetailLinks}
              detailAnswersLockedHint={detailAnswersLockedHint}
            />
          </>
        ) : null}

        <Space wrap>
          {canStartNew ? (
            hasPriorQuizAttemptsForUi(attemptHistory) && !mockTestOnlineUi ? (
              <Button color="green" variant="solid" size="large" onClick={onOpenConfirmStart}>
                Làm bài mới
                {eligibility?.attemptsRemaining != null && eligibility.attemptsRemaining > 0
                  ? ` (${eligibility.attemptsRemaining} lượt còn lại)`
                  : ''}
              </Button>
            ) : (
              <Button type="primary" size="large" block={mockTestOnlineUi} onClick={onOpenConfirmStart}>
                {mockTestOnlineUi ? 'Tiếp tục — chuẩn bị & xác nhận' : 'Bắt đầu làm bài'}
              </Button>
            )
          ) : null}
          {!mockTestOnlineUi && !canStartNew && resultsPageHref ? (
            <Link href={resultsPageHref}>
              <Button type="primary" size="large">
                Xem kết quả các lần làm
              </Button>
            </Link>
          ) : null}
          {!mockTestOnlineUi && canStartNew && resultsPageHref && attemptHistory.length > 0 ? (
            <Link href={resultsPageHref}>
              <Button size="large">Xem kết quả</Button>
            </Link>
          ) : null}
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
  backHref,
  errMsg,
  rulesAcknowledged,
  onRulesAcknowledgedChange,
  onBack,
  onStart,
  mockTestOnlineUi = false,
  expectedScore = null,
  onExpectedScoreChange,
  speakerChecked = false,
  onSpeakerCheckedChange,
}: QuizAttemptConfirmSectionProps) {
  const expectedScale = useMemo(
    () =>
      resolveExamExpectedScoreScale({
        formType: formPayload.type,
        tagKeys: formTagKeys,
      }),
    [formPayload.type, formTagKeys],
  );

  const canStartMockOnline =
    !mockTestOnlineUi ||
    (rulesAcknowledged &&
      speakerChecked &&
      normalizeExamExpectedScore(expectedScore, expectedScale) != null);

  return (
    <Card bordered={mockTestOnlineUi ? false : undefined}>
      <Space direction="vertical" size="middle" className="w-full max-w-3xl">
        {!mockTestOnlineUi ? (
          <Link href={backHref ?? '/assignments'}>
            <Button type="default" icon={<ArrowLeftOutlined />} size="small">
              Quay lại
            </Button>
          </Link>
        ) : (
          <Button type="default" icon={<ArrowLeftOutlined />} size="small" onClick={onBack}>
            Quay lại
          </Button>
        )}

        <Typography.Title level={4} style={{ margin: 0 }}>
          {mockTestOnlineUi ? 'Xác nhận sẵn sàng & bắt đầu' : 'Xác nhận làm bài'}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {mockTestOnlineUi
            ? 'Kiểm tra loa, nhập điểm kỳ vọng cho lần thi này, rồi xác nhận trước khi đồng hồ bắt đầu chạy.'
            : 'Bạn sắp bắt đầu một phiên làm bài có giới hạn thời gian. Hãy đảm bảo mạng ổn định và không đóng trình duyệt giữa chừng.'}
        </Typography.Paragraph>

        <Alert
          type="info"
          showIcon
          message={mockTestOnlineUi ? 'Lưu ý khi làm bài' : 'Quy định & lưu ý (có thể bổ sung sau)'}
          description={
            <ul className="mb-0 list-disc pl-5">
              <li>Làm bài trung thực, không gian lận.</li>
              <li>Hết thời gian, bài có thể được nộp tự động.</li>
              {!mockTestOnlineUi ? (
                <li>Câu trả lời được lưu nháp theo từng thao tác (khi kết nối cho phép).</li>
              ) : (
                <li>Câu trả lời được lưu tự động khi bạn làm bài.</li>
              )}
              {mockTestOnlineUi ? (
                <li>Điểm kỳ vọng chỉ áp dụng cho lần làm bài này — thi lại có thể nhập khác.</li>
              ) : null}
            </ul>
          }
        />

        <div>
          <Typography.Text strong>{mockTestOnlineUi ? 'Bài thi' : 'Đề'}</Typography.Text>
          <div className="mt-2">
            <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
              {title}
            </Typography.Title>
            <QuizFormMetaBlock
              formType={formPayload.type ?? null}
              tagKeys={formTagKeys}
              durationSummary={durationSummary}
            />
          </div>
        </div>

        {mockTestOnlineUi ? (
          <>
            <div>
              <Typography.Text strong className="block mb-2">
                Điểm kỳ vọng (lần thi này)
              </Typography.Text>
              <InputNumber
                className="!w-full max-w-xs"
                min={expectedScale.min}
                max={expectedScale.max}
                step={expectedScale.step}
                value={expectedScore ?? undefined}
                onChange={(v) => {
                  onExpectedScoreChange?.(
                    v == null ? null : normalizeExamExpectedScore(v, expectedScale),
                  );
                }}
                placeholder={`${expectedScale.min} – ${expectedScale.max}`}
              />
              <Typography.Paragraph type="secondary" className="!mt-2 !mb-0 text-sm">
                {expectedScale.hint} Dùng để so sánh với kết quả thực tế sau khi nộp bài.
              </Typography.Paragraph>
            </div>

            <MockTestOnlineSpeakerTest
              checked={speakerChecked}
              onCheckedChange={(next) => onSpeakerCheckedChange?.(next)}
            />
          </>
        ) : null}

        {formHasAutoPlaybackListeningSection(formPayload) ||
        formHasOnDemandPlaybackListeningSection(formPayload) ? (
          <Alert
            type="warning"
            showIcon
            message="Đề có phần nghe"
            description={
              <ul className="mb-0 list-disc pl-5">
                {formHasAutoPlaybackListeningSection(formPayload) ? (
                  <li>
                    Một số phần <strong>tự phát âm thanh</strong> theo cài đặt đề (sau
                    countdown). Nhấn «Xác nhận và bắt đầu» để trình duyệt cho phép phát
                    âm thanh — bắt buộc trên Safari/iPhone; không có hộp thoại quyền riêng
                    như micro.
                  </li>
                ) : null}
                {formHasOnDemandPlaybackListeningSection(formPayload) ? (
                  <li>
                    Một số phần chỉ phát khi bạn bấm nút <strong>Nghe</strong> — không tự
                    phát, đúng theo cài đặt section.
                  </li>
                ) : null}
                <li>Dùng tai nghe và kiểm tra âm lượng trước khi vào phần nghe.</li>
              </ul>
            }
          />
        ) : null}

        <Checkbox
          checked={rulesAcknowledged}
          onChange={(e) => onRulesAcknowledgedChange(e.target.checked)}
        >
          Tôi đã đọc và đồng ý bắt đầu làm bài trong phạm vi thời gian quy định.
        </Checkbox>

        {errMsg ? <Alert type="error" message={errMsg} /> : null}

        <Space wrap>
          <Button onClick={onBack}>Quay lại</Button>
          <Button
            type="primary"
            size="large"
            disabled={mockTestOnlineUi ? !canStartMockOnline : !rulesAcknowledged}
            onClick={() => {
              if (
                formHasAutoPlaybackListeningSection(formPayload) ||
                mockTestOnlineUi
              ) {
                void unlockQuizAudioSession();
              }
              const score = mockTestOnlineUi
                ? normalizeExamExpectedScore(expectedScore, expectedScale)
                : null;
              onStart(
                mockTestOnlineUi
                  ? { expectedScore: score }
                  : undefined,
              );
            }}
          >
            {mockTestOnlineUi ? 'Sẵn sàng — bắt đầu làm bài' : 'Xác nhận và bắt đầu làm bài'}
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
  backHref,
  submitResult,
  attemptHistory,
  onOpenConfirmStart,
  onRefreshHistory,
  assignmentId,
  canStartNew = true,
  resultsPageHref,
  allowHistoryDetailLinks = true,
  eligibility,
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
  const detailAnswersLockedHint = allowHistoryDetailLinks
    ? null
    : describeQuizResultDetailLocked(eligibility);

  return (
    <Card>
      <Space direction="vertical" size="middle" className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={backHref ?? '/assignments'}>
            <Button type="default" icon={<ArrowLeftOutlined />} size="small">
              Quay lại
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

        <QuizAttemptQuotaSummary eligibility={eligibility} />

        <Divider style={{ margin: '8px 0' }} />

        {/* History with highlight for current/latest attempt */}
        <QuizAttemptHistoryList
          formPublicId={formPublicId}
          rows={history}
          title="Các bài đã làm"
          description={
            allowHistoryDetailLinks
              ? 'Bấm từng lần làm để xem thông tin và kết quả bài của bạn.'
              : 'Danh sách các lần đã nộp. Chi tiết đáp án mở khi hết lượt hoặc đạt 100%.'
          }
          vertical
          showScore
          highlightAttemptId={latestAttemptId}
          onRefresh={onRefreshHistory}
          allowDetailLinks={allowHistoryDetailLinks}
          detailAnswersLockedHint={detailAnswersLockedHint}
        />

        {/* Action buttons */}
        <Space wrap>
          {canStartNew ? (
            <Button color="green" variant="solid" onClick={onOpenConfirmStart}>
              Làm bài mới
              {eligibility?.attemptsRemaining != null && eligibility.attemptsRemaining > 0
                ? ` (${eligibility.attemptsRemaining} lượt còn lại)`
                : ''}
            </Button>
          ) : null}
          {resultsPageHref ? (
            <Link href={resultsPageHref}>
              <Button type="default">Các lần làm khác</Button>
            </Link>
          ) : (
            <Link href={`/quiz-test/${formPublicId}`}>
              <Button type="default">Quay lại đề</Button>
            </Link>
          )}
        </Space>
      </Space>
    </Card>
  );
}
