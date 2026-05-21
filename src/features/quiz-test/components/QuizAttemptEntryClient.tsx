'use client';

import { QuizAttemptClient } from '@/features/quiz-test/components/QuizAttemptClient';
import { useQuizDeliveryContext } from '@/features/quiz-test/hooks/useQuizDeliveryContext';
import { setQuizFormContext } from '@/lib/quiz-form-context';
import { Alert, Card, Skeleton } from 'antd';
import Link from 'next/link';
import { useEffect } from 'react';

type Props = {
  formPublicId: string;
  /** Mở từ menu ôn luyện */
  preferPractice?: boolean;
  initialSectionId?: number;
  initialQuestionKey?: string | null;
};

export function QuizAttemptEntryClient({
  formPublicId,
  preferPractice,
  initialSectionId,
  initialQuestionKey,
}: Props) {
  const { access, loading, error, assignmentId, practiceMode } =
    useQuizDeliveryContext(formPublicId, { preferPractice });

  useEffect(() => {
    if (!access) return;
    if (access.mode === 'assignment' && access.assignmentId != null) {
      setQuizFormContext(formPublicId, {
        mode: 'assignment',
        assignmentId: access.assignmentId,
        quizMaxAttempts: access.effectiveMaxAttempts,
      });
    } else if (access.practiceMode) {
      setQuizFormContext(formPublicId, { mode: 'practice' });
    }
  }, [access, formPublicId]);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (error || !access) {
    return (
      <Card>
        <Alert
          type="error"
          showIcon
          message={error ?? 'Không mở được đề thi.'}
        />
        <Link href={preferPractice ? '/practice-quizzes' : '/assignments'} className="mt-4 inline-block">
          Quay lại danh sách
        </Link>
      </Card>
    );
  }

  return (
    <QuizAttemptClient
      formPublicId={formPublicId}
      assignmentId={assignmentId}
      practiceMode={practiceMode}
      initialSectionId={initialSectionId}
      initialQuestionKey={initialQuestionKey}
    />
  );
}
