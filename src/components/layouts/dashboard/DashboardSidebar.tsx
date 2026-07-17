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
  /** Menu items (có thể gồm divider) */
  menuItems: MenuProps['items'];
  selectedKeys: string[];
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  /** Logo home — lead dùng `/mock-test`, HV dùng `/`. */
  logoHref?: string;
}

export default function DashboardSidebar({
  collapsed,
  onCollapse,
  menuItems,
  selectedKeys,
  openKeys,
  onOpenChange,
  logoHref = '/',
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
            href: logoHref,
            title: 'EBest English',
            className: 'flex w-full items-center justify-center py-2',
          }}
        />
      </div>
      <Menu
        theme="light"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        mode="inline"
        items={menuItems}
        className="border-r-0 bg-transparent"
        style={{ marginTop: 8 }}
      />
    </Sider>
  );
}
