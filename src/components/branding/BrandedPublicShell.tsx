'use client';

import { EbestLogo } from '@/components/branding/EbestLogo';
import { APP_BRAND } from '@/lib/ui-constants';

type Props = {
  children: React.ReactNode;
  /** Container width for main content (Tailwind class) */
  maxWidthClass?: string;
  /** Dòng phụ dưới logo */
  tagline?: string;
  /** next/image priority (LCP) — bật trang SSR quan trọng */
  logoPriority?: boolean;
};

const DEFAULT_TAGLINE = `Hoàn thiện hồ sơ học viên — ${APP_BRAND}`;

/**
 * Vỏ thị giác thống nhất với trang đăng nhập: nền gradient, logo, tagline.
 */
export function BrandedPublicShell({
  children,
  maxWidthClass = 'max-w-4xl',
  tagline = DEFAULT_TAGLINE,
  logoPriority,
}: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-center gap-2">
        <EbestLogo variant="login-hero" priority={logoPriority} />
        {tagline ? (
          <p className="max-w-xl text-center text-sm text-gray-600">{tagline}</p>
        ) : null}
      </div>
      <div className={`mx-auto ${maxWidthClass}`}>{children}</div>
    </div>
  );
}
