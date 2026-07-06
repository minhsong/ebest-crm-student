'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Layout, Menu, ConfigProvider, Drawer } from 'antd';
import type { MenuProps } from 'antd';
import Link from 'next/link';
import { SIDER_WIDTH, SIDER_COLLAPSED_WIDTH } from '@/lib/ui-constants';
import { dashboardAntdTheme } from '@/lib/ebest-antd-theme';
import { useDashboardMobile } from '@/hooks/use-dashboard-mobile';
import { useDashboardMenuState } from '@/hooks/use-dashboard-menu-state';
import { EbestLogo } from '@/components/branding/EbestLogo';
import { LoadingState } from '@/components/layout';
import { getBreadcrumbFromPath } from '@/lib/dashboard-menu';
import DashboardSidebar from '@/components/layouts/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/layouts/dashboard/DashboardHeader';
import DashboardFooter from '@/components/layouts/dashboard/DashboardFooter';

const { Content } = Layout;

export type PortalDashboardShellProps = {
  children: ReactNode;
  menuItems: NonNullable<MenuProps['items']>;
  userDisplayName: string;
  avatarUrl?: string | null;
  /** null = lead (chưa có trang hồ sơ). */
  profileHref?: string | null;
  homeHref?: string;
  onLogout: () => void;
  ready?: boolean;
  loadingTip?: string;
  /** Sidebar thu gọn khi vào màn làm bài (exam focus). */
  defaultSidebarCollapsed?: boolean;
};

/**
 * Chrome dashboard dùng chung lead + customer: sidebar, header, footer.
 */
export function PortalDashboardShell({
  children,
  menuItems,
  userDisplayName,
  avatarUrl,
  profileHref = '/profile',
  homeHref = '/',
  onLogout,
  ready = true,
  loadingTip = 'Đang tải...',
  defaultSidebarCollapsed = false,
}: PortalDashboardShellProps) {
  const pathname = usePathname();
  const isMobile = useDashboardMobile();
  const [collapsed, setCollapsed] = useState(defaultSidebarCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navFill, setNavFill] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const menuState = useDashboardMenuState(pathname ?? '');

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
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => setNavFill(el.scrollTop > 5);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <LoadingState tip={loadingTip} />
      </div>
    );
  }

  const sidebarWidth = isMobile
    ? 0
    : collapsed
      ? SIDER_COLLAPSED_WIDTH
      : SIDER_WIDTH;

  return (
    <ConfigProvider theme={dashboardAntdTheme}>
      <Layout className="min-h-screen" style={{ background: '#f0f2f5' }}>
        {isMobile ? null : (
          <DashboardSidebar
            collapsed={collapsed}
            onCollapse={setCollapsed}
            menuItems={menuItems}
            selectedKeys={menuState.selectedKeys}
            openKeys={menuState.openKeys}
            onOpenChange={menuState.onOpenChange}
            logoHref={homeHref}
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
            userDisplayName={userDisplayName}
            avatarUrl={avatarUrl}
            profileHref={profileHref}
            onLogout={onLogout}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          <Content ref={contentRef} className="dashboard-layout-content">
            <main style={{ maxWidth: '100%' }}>{children}</main>
          </Content>

          <DashboardFooter />
        </Layout>
      </Layout>

      {isMobile && (
        <Drawer
          title={
            <EbestLogo
              variant="drawer-header"
              link={{
                href: homeHref,
                onClick: () => setDrawerOpen(false),
                className: '-m-1 flex items-center py-0.5',
              }}
            />
          }
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={280}
          styles={{
            body: { padding: 0, background: '#ffffff' },
            header: { borderBottom: '1px solid #f0f0f0' },
          }}
        >
          <Menu
            selectedKeys={menuState.selectedKeys}
            openKeys={menuState.openKeys}
            onOpenChange={menuState.onOpenChange}
            mode="inline"
            items={menuItems}
            style={{ borderRight: 0 }}
            onClick={() => setDrawerOpen(false)}
          />
        </Drawer>
      )}
    </ConfigProvider>
  );
}
