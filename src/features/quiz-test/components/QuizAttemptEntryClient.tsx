'use client';

import { QuizAttemptClient } from '@/features/quiz-test/components/QuizAttemptClient';
import { useQuizDeliveryContext } from '@/features/quiz-test/hooks/useQuizDeliveryContext';
import { getQuizFormContext } from '@/lib/quiz-form-context';
import {
  peekActiveQuizResumeAccess,
  type ActiveQuizResumePeek,
} from '@/lib/quiz-resume-access';
import { Alert, Card, Skeleton } from 'antd';
import Link from 'next/link';
import { useLayoutEffect, useState } from 'react';

type Props = {
  formPublicId: string;
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
  const [assignmentIdHint] = useState(() => {
    if (preferPractice) return undefined;
    const ctx = getQuizFormContext(formPublicId);
    return ctx?.mode === 'assignment' ? ctx.assignmentId : undefined;
  });

  const [resumePeek, setResumePeek] = useState<ActiveQuizResumePeek | 'pending'>(
    'pending',
  );

  useLayoutEffect(() => {
    if (preferPractice) {
      setResumePeek({ inProgress: false, state: null, access: null });
      return;
    }
    let cancelled = false;
    void peekActiveQuizResumeAccess(formPublicId).then((peek) => {
      if (!cancelled) setResumePeek(peek);
    });
    return () => {
      cancelled = true;
    };
  }, [formPublicId, preferPractice]);

  const resumeActive = resumePeek !== 'pending' && resumePeek.inProgress;
  const needDeliveryContext = resumePeek !== 'pending' && !resumeActive;

  const { access, loading, error, assignmentId, practiceMode } =
    useQuizDeliveryContext(formPublicId, {
      preferPractice,
      assignmentIdHint,
      enabled: needDeliveryContext,
    });

  const finalAccess = resumeActive ? resumePeek.access : access;

  if (resumePeek === 'pending' || (needDeliveryContext && loading)) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (!finalAccess && !resumeActive) {
    return (
      <Card>
        <Alert
          type="error"
          showIcon
          message={error ?? 'Không mở được đề thi.'}
        />
        <Link
          href={preferPractice ? '/learning' : '/assignments'}
          className="mt-4 inline-block"
        >
          Quay lại danh sách
        </Link>
      </Card>
    );
  }

  const resolvedAssignmentId =
    finalAccess?.mode === 'assignment'
      ? finalAccess.assignmentId
      : resumeActive
        ? assignmentIdHint
        : assignmentId;
  const resolvedPracticeMode =
    finalAccess?.practiceMode ?? practiceMode ?? preferPractice ?? false;

  return (
    <QuizAttemptClient
      formPublicId={formPublicId}
      assignmentId={resolvedAssignmentId}
      practiceMode={resolvedPracticeMode}
      effectiveMaxAttempts={
        finalAccess?.mode === 'assignment'
          ? finalAccess.effectiveMaxAttempts
          : undefined
      }
      initialSectionId={initialSectionId}
      initialQuestionKey={initialQuestionKey}
    />
  );
}
