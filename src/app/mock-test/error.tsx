'use client';

import { useEffect } from 'react';
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
 * Segment error — hub portal `/mock-test/*`.
 */
export default function PortalMockTestError({ error, reset }: Props) {
  const isConnection = isUpstreamConnectionFailure(error);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[student-portal] mock-test/error', error);
    }
  }, [error]);

  if (isConnection) {
    return <CannotConnectToServerPanel onRetry={reset} />;
  }

  return (
    <MockTestStepErrorPanel
      variant="portal"
      description={STUDENT_SAFE_USER_MESSAGES.generic}
      onRetry={reset}
      digest={error.digest}
    />
  );
}
