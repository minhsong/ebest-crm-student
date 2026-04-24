'use client';

import { Layout, Button, Breadcrumb, Dropdown, Avatar } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  DownOutlined,
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
  /** Ảnh đại diện từ CRM `/me` (thumbnail); cùng nguồn với cache Redis phía API. */
  avatarUrl?: string | null;
  profileHref?: string;
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
  avatarUrl,
  profileHref = '/profile',
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
      <div className="flex flex-shrink-0 items-center gap-0.5">
        <Link
          href={profileHref}
          className="flex min-w-0 max-w-[220px] sm:max-w-[280px] items-center gap-2 rounded-lg px-2 py-1 text-left text-gray-900 transition-colors hover:bg-gray-50"
          onClick={() => onProfileClick?.()}
        >
          <Avatar
            src={avatarUrl || undefined}
            icon={<UserOutlined />}
            size={36}
            className="flex-shrink-0"
          />
          <span className="truncate text-sm font-medium">{userDisplayName}</span>
        </Link>
        <Dropdown
          menu={{
            items: [
              {
                key: 'profile',
                icon: <UserOutlined />,
                label: (
                  <Link href={profileHref} onClick={() => onProfileClick?.()}>
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
          placement="bottomRight"
        >
          <Button
            type="text"
            className="flex h-9 w-8 items-center justify-center flex-shrink-0 text-gray-600"
            aria-label="Menu tài khoản"
            icon={<DownOutlined />}
          />
        </Dropdown>
      </div>
    </Header>
  );
}
