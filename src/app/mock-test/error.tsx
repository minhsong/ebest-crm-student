'use client';

import { useEffect, useMemo } from 'react';
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

export default function PortalMockTestError({ error, reset }: Props) {
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
    console.error('[student-portal] mock-test/error', error);
    reportMockTestClientError({
      context: 'mto.segment.mock-test-hub',
      message: error.message,
      digest: error.digest,
      path:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
      stack: error.stack,
      module: 'mto-hub',
      requestId,
    });
  }, [error, requestId]);

  if (isConnection) {
    return <CannotConnectToServerPanel onRetry={reset} />;
  }

  const diagnostics = diagnosticsFromUnknownError(error);
  diagnostics.requestId = requestId;

  return (
    <MockTestStepErrorPanel
      variant="portal"
      description={
        showDetails && error.message
          ? error.message
          : STUDENT_SAFE_USER_MESSAGES.generic
      }
      onRetry={reset}
      digest={error.digest}
      diagnostics={diagnostics}
    />
  );
}
