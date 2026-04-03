import type { ReactNode } from 'react';
import { APP_BRAND, APP_NAME } from '@/lib/ui-constants';

type AuthPageShellProps = {
  title: string;
  /** Mặc định: brand + app name */
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Layout chung cho trang auth một cột (quên mật khẩu, reset, …).
 */
export function AuthPageShell({
  title,
  subtitle = (
    <>
      {APP_BRAND} {APP_NAME}
    </>
  ),
  children,
  className = 'max-w-md',
}: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6">
      <div className={`mx-auto ${className}`}>
        <h1 className="mb-1 mt-0 text-center text-2xl font-semibold text-gray-800">
          {title}
        </h1>
        {subtitle != null && (
          <p className="mb-6 text-center text-sm text-gray-600">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}
