'use client';

import { useEffect } from 'react';
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
 * Error boundary segment — thay trang lỗi mặc định Next bằng UI thân thiện.
 */
export default function AppError({ error, reset }: Props) {
  const isConnection = isUpstreamConnectionFailure(error);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[student-portal] app/error', error);
    }
  }, [error]);

  if (isConnection) {
    return <CannotConnectToServerPanel onRetry={reset} />;
  }

  return (
    <CannotConnectToServerPanel
      onRetry={reset}
      title="Đã xảy ra sự cố"
      description={STUDENT_SAFE_USER_MESSAGES.generic}
    />
  );
}
