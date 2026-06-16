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
  FileDoneOutlined,
  ReadOutlined,
  FontSizeOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { CRM_CLASS_STATUS } from '@/lib/crm-enums';

export interface DashboardMenuClassItem {
  id: number;
  name: string;
  /** CRM `classes.status` (1–6) hoặc legacy string từ `/me` cache. */
  status?: number | string | null;
}

/** Chuẩn hóa status lớp — tránh lệch string vs number từ API `/me`. */
export function normalizeDashboardClassStatus(
  status?: number | string | null,
): number | null {
  if (status == null || status === '') return null;
  if (typeof status === 'number' && Number.isFinite(status)) return status;
  const key = String(status).trim().toUpperCase();
  const map: Record<string, number> = {
    PLANNING: CRM_CLASS_STATUS.PLANNING,
    READY: CRM_CLASS_STATUS.READY,
    IN_PROGRESS: CRM_CLASS_STATUS.IN_PROGRESS,
    COMPLETED: CRM_CLASS_STATUS.COMPLETED,
    CANCELLED: CRM_CLASS_STATUS.CANCELLED,
    DROPPED: CRM_CLASS_STATUS.DROPPED,
  };
  return map[key] ?? null;
}

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
    key: 'learning',
    path: '/learning',
    label: 'Học tập',
    icon: <ReadOutlined />,
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

/** Submenu «Học tập» — thứ tự hiển thị (khớp hub cards + trang). */
const LEARNING_MENU_CHILDREN: Array<{ path: string; label: string; icon?: ReactNode }> = [
  { path: '/learning', label: 'Tổng quan', icon: <ReadOutlined /> },
  { path: '/learning/vocabulary', label: 'Luyện từ vựng', icon: <FontSizeOutlined /> },
  { path: '/learning/games', label: 'Game luyện từ', icon: <PlayCircleOutlined /> },
  { path: '/learning/games/leaderboard', label: 'Bảng xếp hạng', icon: <TrophyOutlined /> },
  { path: '/assignments', label: 'Bài tập', icon: <FileDoneOutlined /> },
];

/** Dài → ngắn khi khớp prefix pathname. */
const LEARNING_MENU_MATCH_ORDER = [...LEARNING_MENU_CHILDREN].sort(
  (a, b) => b.path.length - a.path.length,
);

export const LEARNING_MENU_ROOT = '/learning';

function isLearningSectionPath(pathname: string): boolean {
  const normalized = pathname?.replace(/\/$/, '') || '/';
  return (
    normalized.startsWith('/learning') ||
    normalized.startsWith('/assignments') ||
    normalized.startsWith('/quiz-test')
  );
}

function resolveMenuSelectedKey(pathname: string): string {
  const normalized = pathname?.replace(/\/$/, '') || '/';

  if (normalized.startsWith('/quiz-test')) {
    return '/assignments';
  }
  if (normalized.startsWith('/assignments')) {
    return '/assignments';
  }
  if (!normalized.startsWith('/learning')) {
    return normalized || '/';
  }
  if (normalized.startsWith('/learning/flashcard')) {
    return '/learning/vocabulary';
  }
  if (normalized.startsWith('/learning/practice')) {
    return '/learning/games';
  }
  if (normalized.startsWith('/learning/leaderboard')) {
    return '/learning/games/leaderboard';
  }
  for (const child of LEARNING_MENU_MATCH_ORDER) {
    if (normalized === child.path || normalized.startsWith(`${child.path}/`)) {
      return child.path;
    }
  }
  return LEARNING_MENU_ROOT;
}

/**
 * selectedKeys + openKeys cho Ant Design Menu (sidebar / drawer).
 */
export function resolveDashboardMenuKeys(pathname: string): {
  selectedKeys: string[];
  openKeys: string[];
} {
  const normalized = pathname?.replace(/\/$/, '') || '/';
  const selectedKeys = [resolveMenuSelectedKey(normalized)];
  const openKeys: string[] = [];
  if (isLearningSectionPath(normalized)) {
    openKeys.push(LEARNING_MENU_ROOT);
  }
  if (normalized.startsWith('/classes/') || normalized === '/classes') {
    openKeys.push('/classes');
  }
  return { selectedKeys, openKeys };
}

/**
 * Build `items` cho Ant Design Menu (có divider).
 */
export function buildDashboardMenuAntdItems(
  renderLinkLabel: (path: string, label: string) => ReactNode,
  options?: { classes?: DashboardMenuClassItem[] },
): NonNullable<MenuProps['items']> {
  const classes = Array.isArray(options?.classes) ? options?.classes : [];
  const out: NonNullable<MenuProps['items']> = [];
  for (const entry of DASHBOARD_MENU_ENTRIES) {
    if (entry.type === 'divider') {
      out.push({ type: 'divider', key: entry.key });
    } else {
      if (entry.path === '/classes' && classes.length > 0) {
        const inProgress = classes.filter(
          (c) =>
            normalizeDashboardClassStatus(c.status) ===
            CRM_CLASS_STATUS.IN_PROGRESS,
        );
        const completed = classes.filter(
          (c) =>
            normalizeDashboardClassStatus(c.status) ===
            CRM_CLASS_STATUS.COMPLETED,
        );
        const other = classes.filter((c) => {
          const st = normalizeDashboardClassStatus(c.status);
          return (
            st !== CRM_CLASS_STATUS.IN_PROGRESS &&
            st !== CRM_CLASS_STATUS.COMPLETED
          );
        });

        const toChild = (c: DashboardMenuClassItem) => ({
          key: `/classes/${c.id}`,
          label: renderLinkLabel(`/classes/${c.id}`, c.name),
        });

        const children: NonNullable<MenuProps['items']> = [];
        children.push({
          key: 'classes-all',
          label: renderLinkLabel('/classes', 'Tất cả lớp'),
        });
        if (inProgress.length) {
          children.push({
            type: 'group',
            key: 'classes-in-progress',
            label: 'Đang học',
            children: inProgress.map(toChild),
          });
        }
        if (completed.length) {
          children.push({
            type: 'group',
            key: 'classes-completed',
            label: 'Đã học',
            children: completed.map(toChild),
          });
        }
        if (other.length) {
          children.push({
            type: 'group',
            key: 'classes-other',
            label: 'Khác',
            children: other.map(toChild),
          });
        }

        out.push({
          key: entry.path,
          icon: entry.icon,
          label: renderLinkLabel(entry.path, entry.label),
          children,
        });
        continue;
      }

      if (entry.path === '/learning') {
        out.push({
          key: entry.path,
          icon: entry.icon,
          label: renderLinkLabel(entry.path, entry.label),
          children: LEARNING_MENU_CHILDREN.map((child) => ({
            key: child.path,
            icon: child.icon,
            label: renderLinkLabel(child.path, child.label),
          })),
        });
        continue;
      }

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
  '/learning': 'Học tập',
  '/learning/vocabulary': 'Luyện từ vựng',
  '/learning/flashcard': 'Flashcard',
  '/learning/games': 'Game luyện từ',
  '/learning/games/leaderboard': 'Bảng xếp hạng',
  '/invoices': 'Hóa Đơn',
  '/qa': 'Hỏi đáp',
  '/assignments': 'Bài tập',
  '/learning/practice': 'Game luyện từ',
  '/learning/leaderboard': 'Bảng xếp hạng',
  '/quiz-test': 'Làm bài',
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
