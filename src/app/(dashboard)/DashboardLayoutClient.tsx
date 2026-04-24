'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Layout, Menu, ConfigProvider, Drawer } from 'antd';
import Link from 'next/link';
import { SIDER_WIDTH, SIDER_COLLAPSED_WIDTH } from '@/lib/ui-constants';
import { dashboardAntdTheme } from '@/lib/ebest-antd-theme';
import { useDashboardMobile } from '@/hooks/use-dashboard-mobile';
import { EbestLogo } from '@/components/branding/EbestLogo';
import { LoadingState } from '@/components/layout';
import {
  buildDashboardMenuAntdItems,
  getBreadcrumbFromPath,
} from '@/lib/dashboard-menu';
import {
  DashboardSidebar,
  DashboardHeader,
  DashboardFooter,
} from '@/components/layouts/dashboard';
const { Content } = Layout;

export default function DashboardLayoutClient({
  children,
  initialClasses,
}: {
  children: React.ReactNode;
  initialClasses?: Array<{ id: number; name: string; status?: string | null }> | null;
}) {
  const { customer, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useDashboardMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navFill, setNavFill] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const menuItems = useMemo(
    () =>
      buildDashboardMenuAntdItems(
        (path, label) => (
        <Link href={path} onClick={() => setDrawerOpen(false)}>
          {label}
        </Link>
        ),
        { classes: initialClasses ?? [] },
      ),
    [initialClasses],
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
    if (!customer) {
      router.replace('/login');
    }
  }, [ready, customer, router]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => setNavFill(el.scrollTop > 5);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    void logout();
    router.replace('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5]">
        <LoadingState tip="Đang tải..." />
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const sidebarWidth =
    isMobile ? 0 : collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH;

  return (
    <ConfigProvider theme={dashboardAntdTheme}>
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
            avatarUrl={customer?.avatarUrl}
            profileHref="/profile"
            onLogout={handleLogout}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          <Content
            ref={contentRef}
            className="dashboard-layout-content"
          >
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
                href: '/',
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
