import React from 'react';

interface EmptyStateProps {
  message?: string;
  description?: string;
  className?: string;
}

const DEFAULT_MESSAGE = 'Chưa có dữ liệu.';

/**
 * Trạng thái trống – dùng trong Table/List khi không có bản ghi.
 */
export function EmptyState({
  message = DEFAULT_MESSAGE,
  description,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center text-gray-500 ${className}`}
    >
      <p className="font-medium">{message}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}
