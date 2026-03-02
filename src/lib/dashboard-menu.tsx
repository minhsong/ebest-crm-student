/**
 * Cấu hình menu dashboard – single source of truth cho sidebar và breadcrumb.
 * URL gốc: / (tổng quan), /profile, /classes, /invoices... (student portal tập trung học viên).
 */

import type { ReactNode } from 'react';
import {
  HomeOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  LockOutlined,
} from '@ant-design/icons';

export interface DashboardMenuItem {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
}

/** Thứ tự và cấu hình từng mục menu – đường dẫn tại root */
export const DASHBOARD_MENU_ITEMS: DashboardMenuItem[] = [
  { key: 'overview', path: '/', label: 'Tổng quan', icon: <HomeOutlined /> },
  { key: 'profile', path: '/profile', label: 'Thông tin cá nhân', icon: <UserOutlined /> },
  { key: 'change-password', path: '/change-password', label: 'Đổi mật khẩu', icon: <LockOutlined /> },
  { key: 'classes', path: '/classes', label: 'Lớp học của tôi', icon: <BookOutlined /> },
  { key: 'invoices', path: '/invoices', label: 'Hóa đơn', icon: <FileTextOutlined /> },
];

/** Map path -> label cho breadcrumb (bao gồm path con, VD /invoices/[id]) */
const PATH_LABELS: Record<string, string> = {
  '/': 'Tổng quan',
  '/profile': 'Thông tin cá nhân',
  '/change-password': 'Đổi mật khẩu',
  '/classes': 'Lớp học của tôi',
  '/invoices': 'Hóa đơn',
};

/**
 * Trả về breadcrumb items [{ path, label }] từ pathname.
 * VD: /invoices/123 -> [ Tổng quan, Hóa đơn, Chi tiết ]
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
