'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  MockTestStepErrorPanel,
  type MockTestStepErrorVariant,
} from '@/components/public-mock-test-online/MockTestStepErrorPanel';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

type Props = {
  children: ReactNode;
  variant?: MockTestStepErrorVariant;
  /** Fallback tùy chỉnh thay panel mặc định. */
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  error: Error | null;
};

/**
 * Client ErrorBoundary — bắt crash render trong step mock-test
 * (Next `error.tsx` không bọc event handler / một số subtree client).
 */
export class MockTestClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[mock-test] client ErrorBoundary', error, info);
    }
    this.props.onError?.(error, info);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const safe = sanitizeStudentFacingMessage(error.message);
    return (
      <MockTestStepErrorPanel
        variant={this.props.variant ?? 'generic'}
        description={
          safe ||
          'Đã xảy ra lỗi khi hiển thị bước này. Vui lòng thử lại hoặc bắt đầu lại.'
        }
        onRetry={this.handleRetry}
      />
    );
  }
}
