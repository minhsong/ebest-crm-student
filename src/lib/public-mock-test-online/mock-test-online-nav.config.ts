export type MockTestOnlineNavItem = {
  key: string;
  label: string;
  href: string;
  /** Khớp pathname bắt đầu bằng pattern (ưu tiên item dài hơn) */
  matchPrefix?: string;
};

/** Header thi thử online — chỉ Đăng nhập / Đăng ký (tài khoản cổng). */
export const MOCK_TEST_ONLINE_NAV_ITEMS: MockTestOnlineNavItem[] = [
  {
    key: 'login',
    label: 'Đăng nhập',
    href: '/login?mode=lead',
    matchPrefix: '/login',
  },
  {
    key: 'register',
    label: 'Đăng ký',
    href: '/register',
    matchPrefix: '/register',
  },
];

export function resolveMockTestOnlineNavActiveKey(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const sorted = [...MOCK_TEST_ONLINE_NAV_ITEMS].sort(
    (a, b) => (b.matchPrefix?.length ?? 0) - (a.matchPrefix?.length ?? 0),
  );
  for (const item of sorted) {
    const prefix = item.matchPrefix ?? item.href;
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return item.key;
    }
  }
  return null;
}

/** Màn làm bài full-screen — header gọn (logo, không menu). */
export function isMockTestOnlineExamFocusPath(pathname: string): boolean {
  return /\/mock-test-online\/exam\/run(?:\/|$)/.test(pathname);
}
