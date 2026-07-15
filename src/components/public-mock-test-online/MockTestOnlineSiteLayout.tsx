'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Space } from 'antd';
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
            <div className="mock-test-online-site-header-cta ml-auto">
              <Space wrap size="small">
                {MOCK_TEST_ONLINE_NAV_ITEMS.map((item) => {
                  const active = activeKey === item.key;
                  const isRegister = item.key === 'register';
                  return (
                    <Link key={item.key} href={item.href}>
                      <Button
                        type={isRegister || active ? 'primary' : 'default'}
                        size="middle"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </Space>
            </div>
          ) : null}
        </div>
      </header>
      <main className="mock-test-online-site-main">{children}</main>
      {!examFocus ? (
        <footer className="mock-test-online-site-footer">
          <p>Ebest English — Thi thử online</p>
        </footer>
      ) : null}
    </div>
  );
}
