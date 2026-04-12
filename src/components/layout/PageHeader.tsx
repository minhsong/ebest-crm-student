import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Cùng hàng với tiêu đề, thường bên trái (ví dụ nút quay lại). */
  leading?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
}

/**
 * Tiêu đề trang dashboard – thống nhất với layout.
 */
export function PageHeader({
  title,
  description,
  leading,
  extra,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <h2 className="m-0 min-w-0 flex-1 text-lg font-semibold text-gray-800">
            {title}
          </h2>
        </div>
        {description != null && description !== '' && (
          <div className="mt-0.5 text-[13px] text-gray-500">{description}</div>
        )}
      </div>
      {extra && <div className="mt-2 sm:mt-0">{extra}</div>}
    </div>
  );
}
