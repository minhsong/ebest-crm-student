'use client';

import Image from 'next/image';
import Link from 'next/link';

export const EBEST_LOGO_ALT =
  'EBest English — The best home for English lovers';

type EbestLogoVariant = 'login-hero' | 'drawer-header' | 'sidebar-full' | 'sidebar-icon';

type Props = {
  variant: EbestLogoVariant;
  /** next/image LCP */
  priority?: boolean;
  /** Bọc logo trong Link (sidebar, drawer) */
  link?: {
    href: string;
    onClick?: () => void;
    title?: string;
    className?: string;
  };
};

/**
 * Logo Ebest — một nguồn cho og-image / favicon theo ngữ cảnh.
 */
export function EbestLogo({ variant, priority, link }: Props) {
  const inner =
    variant === 'sidebar-icon' ? (
      <Image
        src="/favi-logo.png"
        alt="EBest"
        width={40}
        height={40}
        className="object-contain"
        priority={priority}
      />
    ) : variant === 'login-hero' ? (
      <Image
        src="/og-image.png"
        alt={EBEST_LOGO_ALT}
        width={320}
        height={120}
        className="h-auto w-full max-w-[280px] object-contain"
        priority={priority}
      />
    ) : variant === 'drawer-header' ? (
      <Image
        src="/og-image.png"
        alt={EBEST_LOGO_ALT}
        width={176}
        height={66}
        className="h-9 w-auto max-w-[min(100%,200px)] object-contain object-left"
        priority={priority}
      />
    ) : (
      <Image
        src="/og-image.png"
        alt={EBEST_LOGO_ALT}
        width={208}
        height={78}
        className="h-auto w-full max-w-[200px] object-contain object-center"
        priority={priority}
      />
    );

  if (!link) {
    return inner;
  }

  return (
    <Link
      href={link.href}
      onClick={link.onClick}
      title={link.title}
      className={link.className}
    >
      {inner}
    </Link>
  );
}
