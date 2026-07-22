'use client';

import { useEffect } from 'react';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestStepErrorPanel } from '@/components/public-mock-test-online/MockTestStepErrorPanel';
import { CannotConnectToServerPanel } from '@/components/errors/CannotConnectToServerPanel';
import {
  isUpstreamConnectionFailure,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Segment error — lobby / run / done (`/mock-test-online/exam/*`).
 */
export default function MockTestOnlineExamError({ error, reset }: Props) {
  const isConnection = isUpstreamConnectionFailure(error);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[student-portal] mock-test-online/exam/error', error);
    }
  }, [error]);

  if (isConnection) {
    return (
      <MockTestOnlineFunnelShell step="exam" showProgress={false}>
        <CannotConnectToServerPanel onRetry={reset} />
      </MockTestOnlineFunnelShell>
    );
  }

  return (
    <MockTestOnlineFunnelShell step="exam" showProgress={false}>
      <MockTestStepErrorPanel
        variant="exam"
        description={
          STUDENT_SAFE_USER_MESSAGES.quizLoadFailed ||
          STUDENT_SAFE_USER_MESSAGES.generic
        }
        onRetry={reset}
        digest={error.digest}
      />
    </MockTestOnlineFunnelShell>
  );
}
