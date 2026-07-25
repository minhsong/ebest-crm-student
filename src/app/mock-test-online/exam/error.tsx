'use client';

import { useEffect, useMemo } from 'react';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestStepErrorPanel } from '@/components/public-mock-test-online/MockTestStepErrorPanel';
import { CannotConnectToServerPanel } from '@/components/errors/CannotConnectToServerPanel';
import {
  isUpstreamConnectionFailure,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import {
  diagnosticsFromUnknownError,
  isMockTestErrorDetailsEnabled,
} from '@/lib/public-mock-test-online/mock-test-error-details';
import { reportMockTestClientError } from '@/lib/public-mock-test-online/report-mock-test-client-error';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MockTestOnlineExamError({ error, reset }: Props) {
  const isConnection = isUpstreamConnectionFailure(error);
  const showDetails = isMockTestErrorDetailsEnabled();
  const requestId = useMemo(
    () =>
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `mto-${Date.now()}`,
    [],
  );

  useEffect(() => {
    console.error('[student-portal] mock-test-online/exam/error', error);
    reportMockTestClientError({
      context: 'mto.segment.mock-test-online-exam',
      message: error.message,
      digest: error.digest,
      path:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
      stack: error.stack,
      module: 'mto-quiz',
      requestId,
    });
  }, [error, requestId]);

  if (isConnection) {
    return (
      <MockTestOnlineFunnelShell step="exam" showProgress={false}>
        <CannotConnectToServerPanel onRetry={reset} />
      </MockTestOnlineFunnelShell>
    );
  }

  const diagnostics = diagnosticsFromUnknownError(error);
  diagnostics.requestId = requestId;

  return (
    <MockTestOnlineFunnelShell step="exam" showProgress={false}>
      <MockTestStepErrorPanel
        variant="exam"
        description={
          showDetails && error.message
            ? error.message
            : STUDENT_SAFE_USER_MESSAGES.quizLoadFailed ||
              STUDENT_SAFE_USER_MESSAGES.generic
        }
        onRetry={reset}
        digest={error.digest}
        diagnostics={diagnostics}
      />
    </MockTestOnlineFunnelShell>
  );
}
