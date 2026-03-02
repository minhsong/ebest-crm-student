'use client';

import { Layout, Menu } from 'antd';
import Link from 'next/link';
import { APP_NAME, SIDER_WIDTH, SIDER_COLLAPSED_WIDTH, SIDEBAR_TITLE_HEIGHT } from '@/lib/ui-constants';
import { DASHBOARD_MENU_ITEMS } from '@/lib/dashboard-menu';

const { Sider } = Layout;

export { SIDER_WIDTH, SIDER_COLLAPSED_WIDTH };

export interface DashboardSidebarProps {
  collapsed: boolean;
  onCollapse?: (collapsed: boolean) => void;
  pathname: string;
  /** Menu items with Link; closeDrawer for mobile */
  menuItems: Array<{ key: string; icon: React.ReactNode; label: React.ReactNode }>;
}

export default function DashboardSidebar({
  collapsed,
  onCollapse,
  pathname,
  menuItems,
}: DashboardSidebarProps) {
  return (
    <Sider
      theme="dark"
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={SIDER_WIDTH}
      collapsedWidth={SIDER_COLLAPSED_WIDTH}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        background: '#001529',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="flex items-center justify-center border-b border-white/10"
        style={{ height: SIDEBAR_TITLE_HEIGHT }}
      >
        <Link
          href="/"
          className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-white"
          style={{
            padding: collapsed ? '0 12px' : '0 16px',
            fontSize: collapsed ? 14 : 16,
          }}
        >
          {collapsed ? 'SP' : APP_NAME}
        </Link>
      </div>
      <Menu
        theme="dark"
        selectedKeys={[pathname]}
        mode="inline"
        items={menuItems}
        style={{ marginTop: 8, borderRight: 0 }}
      />
    </Sider>
  );
}
