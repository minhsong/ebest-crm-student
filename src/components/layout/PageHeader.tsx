import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  extra?: React.ReactNode;
  className?: string;
}

/**
 * Tiêu đề trang dashboard – thống nhất với layout.
 */
export function PageHeader({
  title,
  description,
  extra,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div>
        <h2 className="m-0 text-lg font-semibold text-gray-800">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[13px] text-gray-500">{description}</p>
        )}
      </div>
      {extra && <div className="mt-2 sm:mt-0">{extra}</div>}
    </div>
  );
}
