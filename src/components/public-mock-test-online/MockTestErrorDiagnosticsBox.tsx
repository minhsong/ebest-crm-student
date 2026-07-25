'use client';

import { useCallback, useState } from 'react';
import { Button, Typography, message } from 'antd';
import {
  formatMockTestErrorDiagnostics,
  isMockTestErrorDetailsEnabled,
  type MockTestErrorDiagnostics,
} from '@/lib/public-mock-test-online/mock-test-error-details';

type Props = {
  diagnostics: MockTestErrorDiagnostics;
  /** Mặc định: theo env / NODE_ENV. */
  forceShow?: boolean;
};

/**
 * Khối chi tiết lỗi + nút Copy — dành phase test mock-test.
 */
export function MockTestErrorDiagnosticsBox({
  diagnostics,
  forceShow,
}: Props) {
  const [copied, setCopied] = useState(false);
  const show = forceShow ?? isMockTestErrorDetailsEnabled();
  const text = formatMockTestErrorDiagnostics(diagnostics);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      message.success('Đã copy chi tiết lỗi — gửi cho Ebest để hỗ trợ.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error(
        'Không copy được. Chọn và copy thủ công trong khung bên dưới.',
      );
    }
  }, [text]);

  if (!show) return null;

  return (
    <div className="mt-3 w-full rounded border border-amber-200 bg-amber-50/80 p-3 text-left">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Typography.Text strong className="!text-amber-900">
          Chi tiết kỹ thuật (phase test — copy gửi hỗ trợ)
        </Typography.Text>
        <Button size="small" type="primary" onClick={onCopy}>
          {copied ? 'Đã copy' : 'Copy báo cáo lỗi'}
        </Button>
      </div>
      {diagnostics.code ? (
        <Typography.Paragraph className="!mb-1 !text-xs" copyable>
          <span className="text-neutral-500">Mã: </span>
          <code>{diagnostics.code}</code>
        </Typography.Paragraph>
      ) : null}
      {diagnostics.requestId ? (
        <Typography.Paragraph className="!mb-1 !text-xs" copyable>
          <span className="text-neutral-500">RequestId: </span>
          <code>{diagnostics.requestId}</code>
        </Typography.Paragraph>
      ) : null}
      {diagnostics.rawMessage ? (
        <Typography.Paragraph className="!mb-1 !text-xs break-words">
          <span className="text-neutral-500">Message: </span>
          {diagnostics.rawMessage}
        </Typography.Paragraph>
      ) : null}
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-white/80 p-2 font-mono text-[11px] leading-snug text-neutral-700">
        {text}
      </pre>
    </div>
  );
}
