'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Tag, Typography } from 'antd';
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
      {item.scores ? (
        <p className="mb-0 mt-2 text-sm text-gray-600">
          {formatMockTestScoreLine(item.scores)}
        </p>
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
