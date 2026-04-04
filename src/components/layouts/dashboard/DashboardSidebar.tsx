'use client';

import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { EbestLogo } from '@/components/branding/EbestLogo';
import {
  SIDER_WIDTH,
  SIDER_COLLAPSED_WIDTH,
  SIDEBAR_TITLE_HEIGHT,
} from '@/lib/ui-constants';

const { Sider } = Layout;

export { SIDER_WIDTH, SIDER_COLLAPSED_WIDTH };

export interface DashboardSidebarProps {
  collapsed: boolean;
  onCollapse?: (collapsed: boolean) => void;
  pathname: string;
  /** Menu items (có thể gồm divider) */
  menuItems: MenuProps['items'];
}

export default function DashboardSidebar({
  collapsed,
  onCollapse,
  pathname,
  menuItems,
}: DashboardSidebarProps) {
  return (
    <Sider
      theme="light"
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={SIDER_WIDTH}
      collapsedWidth={SIDER_COLLAPSED_WIDTH}
      className="dashboard-sider-ebest border-r-0 shadow-[4px_0_24px_rgba(15,23,42,0.08)]"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        backgroundColor: '#ffffff',
      }}
    >
      <div
        className="flex items-center justify-center border-b border-gray-100 bg-white px-2"
        style={{ minHeight: SIDEBAR_TITLE_HEIGHT }}
      >
        <EbestLogo
          variant={collapsed ? 'sidebar-icon' : 'sidebar-full'}
          priority
          link={{
            href: '/',
            title: 'EBest English',
            className: 'flex w-full items-center justify-center py-2',
          }}
        />
      </div>
      <Menu
        theme="light"
        selectedKeys={[pathname]}
        mode="inline"
        items={menuItems}
        className="border-r-0 bg-transparent"
        style={{ marginTop: 8 }}
      />
    </Sider>
  );
}
