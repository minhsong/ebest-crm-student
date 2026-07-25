'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  MockTestStepErrorPanel,
  type MockTestStepErrorVariant,
} from '@/components/public-mock-test-online/MockTestStepErrorPanel';
import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';
import {
  diagnosticsFromUnknownError,
  isMockTestErrorDetailsEnabled,
} from '@/lib/public-mock-test-online/mock-test-error-details';
import { reportMockTestClientError } from '@/lib/public-mock-test-online/report-mock-test-client-error';

type Props = {
  children: ReactNode;
  variant?: MockTestStepErrorVariant;
  /** Fallback tùy chỉnh thay panel mặc định. */
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  error: Error | null;
  componentStack?: string;
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
    this.setState({ componentStack: info.componentStack ?? undefined });
    this.props.onError?.(error, info);
    reportMockTestClientError({
      context: 'mto.client-boundary',
      message: error.message,
      path:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
      stack: [error.stack, info.componentStack].filter(Boolean).join('\n'),
    });
  }

  private handleRetry = () => {
    this.setState({ error: null, componentStack: undefined });
  };

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const showDetails = isMockTestErrorDetailsEnabled();
    const safe = sanitizeStudentFacingMessage(error.message);
    const diagnostics = diagnosticsFromUnknownError(error);
    if (componentStack) {
      diagnostics.stack = [
        diagnostics.stack,
        '--- componentStack ---',
        componentStack.slice(0, 2000),
      ]
        .filter(Boolean)
        .join('\n');
    }

    return (
      <MockTestStepErrorPanel
        variant={this.props.variant ?? 'generic'}
        description={
          showDetails && error.message
            ? error.message
            : safe ||
              'Đã xảy ra lỗi khi hiển thị bước này. Vui lòng thử lại hoặc bắt đầu lại.'
        }
        onRetry={this.handleRetry}
        diagnostics={diagnostics}
      />
    );
  }
}
