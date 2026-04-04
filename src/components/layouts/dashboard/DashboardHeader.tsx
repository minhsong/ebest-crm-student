'use client';

import { Layout, Button, Breadcrumb, Dropdown } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { HEADER_HEIGHT } from '@/lib/ui-constants';

const { Header } = Layout;

export interface DashboardHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  breadcrumbItems: Array<{ title: React.ReactNode }>;
  /** Header có nền khi scroll (antd-multipurpose-dashboard navFill) */
  navFill?: boolean;
  userDisplayName: string;
  /** Gọi khi bấm mục profile trong menu (vd. đóng popover) */
  onProfileClick?: () => void;
  onLogout: () => void;
  onOpenDrawer?: () => void;
}

export default function DashboardHeader({
  collapsed,
  onToggleCollapse,
  isMobile,
  breadcrumbItems,
  navFill = false,
  userDisplayName,
  onProfileClick,
  onLogout,
  onOpenDrawer,
}: DashboardHeaderProps) {
  return (
    <Header
      className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 transition-[background,box-shadow] duration-200"
      style={{
        height: HEADER_HEIGHT,
        position: 'sticky',
        top: 0,
        zIndex: 99,
        background: '#fff',
        boxShadow: navFill ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isMobile ? (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onOpenDrawer}
            style={{ fontSize: 18, flexShrink: 0 }}
          />
        ) : (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleCollapse}
            style={{ fontSize: 18, flexShrink: 0 }}
          />
        )}
        <Breadcrumb
          items={breadcrumbItems}
          style={{ fontSize: 13 }}
          className="min-w-0"
        />
      </div>
      <Dropdown
        menu={{
          items: [
            {
              key: 'profile',
              icon: <UserOutlined />,
              label: (
                <Link
                  href="/profile"
                  onClick={() => onProfileClick?.()}
                >
                  Thông tin cá nhân
                </Link>
              ),
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Đăng xuất',
              onClick: onLogout,
            },
          ],
        }}
      >
        <Button type="text" className="flex items-center gap-2 flex-shrink-0">
          <UserOutlined />
          <span className="max-w-[120px] truncate sm:max-w-[180px]">
            {userDisplayName}
          </span>
        </Button>
      </Dropdown>
    </Header>
  );
}
