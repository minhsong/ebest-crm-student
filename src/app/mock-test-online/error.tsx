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
 * Segment error — toàn funnel `/mock-test-online/*`.
 */
export default function MockTestOnlineError({ error, reset }: Props) {
  const isConnection = isUpstreamConnectionFailure(error);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[student-portal] mock-test-online/error', error);
    }
  }, [error]);

  if (isConnection) {
    return (
      <MockTestOnlineFunnelShell step="register" showProgress={false}>
        <CannotConnectToServerPanel onRetry={reset} />
      </MockTestOnlineFunnelShell>
    );
  }

  return (
    <MockTestOnlineFunnelShell step="register" showProgress={false}>
      <MockTestStepErrorPanel
        variant="funnel"
        description={STUDENT_SAFE_USER_MESSAGES.generic}
        onRetry={reset}
        digest={error.digest}
      />
    </MockTestOnlineFunnelShell>
  );
}
