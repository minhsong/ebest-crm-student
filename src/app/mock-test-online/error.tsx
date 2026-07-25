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

/**
 * Segment error — toàn funnel `/mock-test-online/*`.
 * Log client layer + requestId rồi UI hiển thị (không nuốt digest).
 */
export default function MockTestOnlineError({ error, reset }: Props) {
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
    console.error('[student-portal] mock-test-online/error', error);
    reportMockTestClientError({
      context: 'mto.segment.mock-test-online',
      message: error.message,
      digest: error.digest,
      path:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
      stack: error.stack,
      module: 'mto-funnel',
      requestId,
    });
  }, [error, requestId]);

  if (isConnection) {
    return (
      <MockTestOnlineFunnelShell step="register" showProgress={false}>
        <CannotConnectToServerPanel onRetry={reset} />
      </MockTestOnlineFunnelShell>
    );
  }

  const diagnostics = diagnosticsFromUnknownError(error);
  diagnostics.requestId = requestId;

  return (
    <MockTestOnlineFunnelShell step="register" showProgress={false}>
      <MockTestStepErrorPanel
        variant="funnel"
        description={
          showDetails && error.message
            ? error.message
            : STUDENT_SAFE_USER_MESSAGES.generic
        }
        onRetry={reset}
        digest={error.digest}
        diagnostics={diagnostics}
      />
    </MockTestOnlineFunnelShell>
  );
}
