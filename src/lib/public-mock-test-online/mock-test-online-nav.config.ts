export type MockTestOnlineNavItem = {
  key: string;
  label: string;
  href: string;
  /** Khớp pathname bắt đầu bằng pattern (ưu tiên item dài hơn) */
  matchPrefix?: string;
};

/** Menu header trang thi thử online — mở rộng thêm item tại đây. */
export const MOCK_TEST_ONLINE_NAV_ITEMS: MockTestOnlineNavItem[] = [
  {
    key: 'home',
    label: 'Thi thử online',
    href: '/mock-test-online',
    matchPrefix: '/mock-test-online',
  },
  {
    key: 'register',
    label: 'Đăng ký thi',
    href: '/mock-test-online/register',
    matchPrefix: '/mock-test-online/register',
  },
  {
    key: 'results',
    label: 'Kết quả thi',
    href: '/lead/tests',
    matchPrefix: '/lead/tests',
  },
  {
    key: 'login',
    label: 'Đăng nhập',
    href: '/login',
    matchPrefix: '/login',
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
