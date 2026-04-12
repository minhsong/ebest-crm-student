/**
 * Cấu hình menu dashboard – single source of truth cho sidebar và breadcrumb.
 * URL gốc: / (tổng quan), /profile, /classes, /invoices... (student portal tập trung học viên).
 */

import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  LockOutlined,
  CalendarOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

export interface DashboardMenuItem {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
}

export interface DashboardMenuLinkEntry extends DashboardMenuItem {
  type: 'link';
}

export interface DashboardMenuDividerEntry {
  type: 'divider';
  key: string;
}

export type DashboardMenuEntry = DashboardMenuLinkEntry | DashboardMenuDividerEntry;

/** Thứ tự menu: nhóm chính → divider → tài khoản */
export const DASHBOARD_MENU_ENTRIES: DashboardMenuEntry[] = [
  {
    type: 'link',
    key: 'overview',
    path: '/',
    label: 'Tổng quan',
    icon: <HomeOutlined />,
  },
  {
    type: 'link',
    key: 'schedule',
    path: '/schedule',
    label: 'Lịch học',
    icon: <CalendarOutlined />,
  },
  {
    type: 'link',
    key: 'classes',
    path: '/classes',
    label: 'Lớp học của tôi',
    icon: <BookOutlined />,
  },
  {
    type: 'link',
    key: 'invoices',
    path: '/invoices',
    label: 'Hóa Đơn',
    icon: <FileTextOutlined />,
  },
  {
    type: 'link',
    key: 'qa',
    path: '/qa',
    label: 'Hỏi đáp',
    icon: <QuestionCircleOutlined />,
  },
  { type: 'divider', key: 'divider-after-main' },
  {
    type: 'link',
    key: 'profile',
    path: '/profile',
    label: 'Thông tin cá nhân',
    icon: <UserOutlined />,
  },
  {
    type: 'link',
    key: 'change-password',
    path: '/change-password',
    label: 'Đổi mật khẩu',
    icon: <LockOutlined />,
  },
];

/** Chỉ các mục có link (không divider) — dùng khi cần danh sách phẳng */
export const DASHBOARD_MENU_ITEMS: DashboardMenuItem[] = DASHBOARD_MENU_ENTRIES.filter(
  (e): e is DashboardMenuLinkEntry => e.type === 'link',
).map(({ key, path, label, icon }) => ({ key, path, label, icon }));

/**
 * Build `items` cho Ant Design Menu (có divider).
 */
export function buildDashboardMenuAntdItems(
  renderLinkLabel: (path: string, label: string) => ReactNode,
): NonNullable<MenuProps['items']> {
  const out: NonNullable<MenuProps['items']> = [];
  for (const entry of DASHBOARD_MENU_ENTRIES) {
    if (entry.type === 'divider') {
      out.push({ type: 'divider', key: entry.key });
    } else {
      out.push({
        key: entry.path,
        icon: entry.icon,
        label: renderLinkLabel(entry.path, entry.label),
      });
    }
  }
  return out;
}

/** Map path -> label cho breadcrumb (bao gồm path con, VD /invoices/[id]) */
const PATH_LABELS: Record<string, string> = {
  '/': 'Tổng quan',
  '/profile': 'Thông tin cá nhân',
  '/change-password': 'Đổi mật khẩu',
  '/classes': 'Lớp học của tôi',
  '/schedule': 'Lịch học',
  '/invoices': 'Hóa Đơn',
  '/qa': 'Hỏi đáp',
};

/**
 * Trả về breadcrumb items [{ path, label }] từ pathname.
 * VD: /invoices/123 -> [ Tổng quan, Hóa Đơn, Chi tiết ]
 */
export function getBreadcrumbFromPath(pathname: string): Array<{ path: string; label: string }> {
  const normalized = pathname?.replace(/\/$/, '') || '';
  const segments = normalized.split('/').filter(Boolean);
  const items: Array<{ path: string; label: string }> = [];
  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    acc += (acc ? '/' : '') + segments[i];
    const fullPath = '/' + acc;
    const label =
      PATH_LABELS[fullPath] ??
      (i === segments.length - 1 && segments[i] !== 'dashboard' ? 'Chi tiết' : segments[i]);
    items.push({ path: fullPath, label });
  }
  if (items.length === 0) {
    items.push({ path: '/', label: 'Tổng quan' });
  }
  return items;
}
