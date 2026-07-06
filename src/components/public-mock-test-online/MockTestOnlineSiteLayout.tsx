'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from 'antd';
import { EbestLogo } from '@/components/branding/EbestLogo';
import {
  isMockTestOnlineExamFocusPath,
  MOCK_TEST_ONLINE_NAV_ITEMS,
  resolveMockTestOnlineNavActiveKey,
} from '@/lib/public-mock-test-online/mock-test-online-nav.config';

type Props = {
  children: ReactNode;
};

export function MockTestOnlineSiteLayout({ children }: Props) {
  const pathname = usePathname() ?? '';
  const examFocus = isMockTestOnlineExamFocusPath(pathname);
  const activeKey = resolveMockTestOnlineNavActiveKey(pathname);

  return (
    <div className="mock-test-online-site">
      <header
        className={`mock-test-online-site-header${examFocus ? ' mock-test-online-site-header--compact' : ''}`}
      >
        <div className="mock-test-online-site-header-inner">
          <EbestLogo
            variant="sidebar-full"
            link={{ href: '/mock-test-online', title: 'Thi thử online Ebest' }}
          />
          {!examFocus ? (
            <nav className="mock-test-online-site-nav" aria-label="Thi thử online">
              {MOCK_TEST_ONLINE_NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`mock-test-online-site-nav-link${activeKey === item.key ? ' mock-test-online-site-nav-link--active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          {!examFocus ? (
            <div className="mock-test-online-site-header-cta">
              <Link href="/mock-test-online/register">
                <Button type="primary" size="middle">
                  Đăng ký ngay
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </header>
      <main className="mock-test-online-site-main">{children}</main>
      {!examFocus ? (
        <footer className="mock-test-online-site-footer">
          <p>Ebest English — Thi thử TOEIC online</p>
        </footer>
      ) : null}
    </div>
  );
}
