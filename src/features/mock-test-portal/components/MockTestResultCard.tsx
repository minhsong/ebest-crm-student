'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Collapse, Progress, Tag, Typography } from 'antd';
import type { LeadTestResultSummary } from '@/lib/lead-portal/types';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { navigateMockTestOnlineResume } from '@/lib/public-mock-test-online/mock-test-online-resume-navigation.client';
import {
  formatMockTestScoreLine,
  formatMockTestScoredAt,
  getMockTestDeliveryModeTag,
  getMockTestResultTitle,
} from '@/features/mock-test-portal/lib/mock-test-result-display.util';

const { Text } = Typography;

type Props = {
  item: LeadTestResultSummary;
  inExamAttemptStatus?: MockTestOnlineAttemptStatus | null;
};

/** Một dòng kết quả thi thử — presentational, không fetch. */
export function MockTestResultCard({ item, inExamAttemptStatus = null }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const scoredLabel = formatMockTestScoredAt(item.scoredAt);
  const isInExam = item.status === 'in_exam';
  const deliveryTag = getMockTestDeliveryModeTag(item.deliveryMode);
  const trackingLabel =
    !item.scores && item.statusLabel ? item.statusLabel : null;
  const canResume =
    isInExam &&
    inExamAttemptStatus?.activeInExam?.resumeAllowed === true &&
    inExamAttemptStatus.activeInExam.registrationId === item.registrationId;

  const deadline = inExamAttemptStatus?.activeInExam?.examUnlockExpiresAt
    ? new Date(inExamAttemptStatus.activeInExam.examUnlockExpiresAt).toLocaleString(
        'vi-VN',
        {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        },
      )
    : item.examUnlockExpiresAt
      ? new Date(item.examUnlockExpiresAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })
      : null;

  return (
    <Card
      size="small"
      className={
        isInExam ? 'border-amber-300 bg-amber-50/50 shadow-sm' : 'shadow-sm'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Text strong>{getMockTestResultTitle(item)}</Text>
        {deliveryTag ? <Tag>{deliveryTag}</Tag> : null}
        {isInExam ? <Tag color="gold">Đang làm bài</Tag> : null}
        {!isInExam && trackingLabel ? (
          <Tag color="processing">{trackingLabel}</Tag>
        ) : null}
      </div>
      {isInExam ? (
        <p className="mb-0 mt-1 text-sm text-gray-600">
          Bài thi chưa nộp.
          {deadline ? ` Hạn làm bài: ${deadline}.` : null}
        </p>
      ) : null}
      {scoredLabel ? (
        <p className="mb-0 mt-1 text-xs text-gray-500">Chấm điểm: {scoredLabel}</p>
      ) : null}
      {item.resultView || item.scores ? (
        <p className="mb-0 mt-2 text-sm text-gray-600">
          {item.resultView?.total.display ??
            (item.scores ? formatMockTestScoreLine(item.scores) : '—')}
        </p>
      ) : null}
      {item.resultView?.skills.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {item.resultView.skills.map((skill) => (
            <div key={skill.code} className="rounded border border-gray-200 p-2">
              <div className="flex justify-between text-sm">
                <Text>{skill.label}</Text>
                <Text strong>{skill.display}</Text>
              </div>
              <Progress
                percent={
                  skill.max > 0
                    ? Math.round((skill.value / skill.max) * 100)
                    : 0
                }
                showInfo={false}
                size="small"
              />
            </div>
          ))}
        </div>
      ) : null}
      {item.resultView?.details.length ? (
        <Collapse
          ghost
          size="small"
          className="mt-2"
          items={[
            {
              key: 'details',
              label: 'Xem chi tiết từng phần',
              children: (
                <div className="grid gap-2 sm:grid-cols-2">
                  {item.resultView.details.map((detail) => (
                    <div
                      key={detail.code}
                      className="flex justify-between rounded bg-gray-50 px-3 py-2 text-sm"
                    >
                      <Text>{detail.label}</Text>
                      <Text strong>
                        {detail.rawCorrect ?? '—'}/{detail.totalQuestions ?? '—'}
                        {detail.accuracy != null
                          ? ` · ${Math.round(detail.accuracy * 100)}%`
                          : ''}
                      </Text>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      ) : null}
      {canResume && inExamAttemptStatus ? (
        <Button
          type="primary"
          size="small"
          className="mt-3"
          loading={loading}
          onClick={() => {
            setLoading(true);
            void navigateMockTestOnlineResume(inExamAttemptStatus, router).finally(
              () => setLoading(false),
            );
          }}
        >
          Tiếp tục làm bài
        </Button>
      ) : null}
    </Card>
  );
}
