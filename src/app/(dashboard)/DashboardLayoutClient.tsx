'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Layout, Menu, ConfigProvider, Drawer } from 'antd';
import Link from 'next/link';
import {
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  SIDER_WIDTH,
  SIDER_COLLAPSED_WIDTH,
} from '@/lib/ui-constants';
import { LoadingState } from '@/components/layout';
import {
  DASHBOARD_MENU_ITEMS,
  getBreadcrumbFromPath,
} from '@/lib/dashboard-menu';
import {
  DashboardSidebar,
  DashboardHeader,
  DashboardFooter,
} from '@/components/layouts/dashboard';
import { APP_NAME } from '@/lib/ui-constants';

const { Content } = Layout;

/** Breakpoint 769px như antd-multipurpose-dashboard */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 769px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
}

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, customer, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navFill, setNavFill] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const menuItems = useMemo(
    () =>
      DASHBOARD_MENU_ITEMS.map((item) => ({
        key: item.path,
        icon: item.icon,
        label: (
          <Link href={item.path} onClick={() => setDrawerOpen(false)}>
            {item.label}
          </Link>
        ),
      })),
    [],
  );

  const breadcrumbItems = useMemo(() => {
    const items = getBreadcrumbFromPath(pathname ?? '');
    return items.map((item, i) => ({
      title:
        i < items.length - 1 ? (
          <Link href={item.path}>{item.label}</Link>
        ) : (
          item.label
        ),
    }));
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;
    if (!accessToken) {
      router.replace('/login');
    }
  }, [ready, accessToken, router]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => setNavFill(el.scrollTop > 5);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <LoadingState tip="Đang tải..." />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  const sidebarWidth =
    isMobile ? 0 : collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f0f2f5',
          borderRadius: 6,
        },
      }}
    >
      <Layout className="min-h-screen" style={{ background: '#f0f2f5' }}>
        {isMobile ? null : (
          <DashboardSidebar
            collapsed={collapsed}
            onCollapse={setCollapsed}
            pathname={pathname ?? ''}
            menuItems={menuItems}
          />
        )}

        <Layout
          style={{
            marginLeft: sidebarWidth,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            transition: 'margin-left 0.2s',
          }}
        >
          <DashboardHeader
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            isMobile={isMobile}
            breadcrumbItems={breadcrumbItems}
            navFill={navFill}
            userDisplayName={customer?.fullName ?? 'Học viên'}
            onProfileClick={() => {}}
            onLogout={handleLogout}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          <Content
            ref={contentRef}
            className="flex-1 overflow-auto"
            style={{
              padding: 24,
              minHeight: `calc(100vh - ${HEADER_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
              background: '#f0f2f5',
            }}
          >
            <main style={{ maxWidth: 1200 }}>{children}</main>
          </Content>

          <DashboardFooter />
        </Layout>
      </Layout>

      {isMobile && (
        <Drawer
          title={APP_NAME}
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            selectedKeys={[pathname ?? '']}
            mode="inline"
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Drawer>
      )}
    </ConfigProvider>
  );
}
