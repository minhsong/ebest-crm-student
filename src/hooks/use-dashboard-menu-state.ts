'use client';

import { useEffect, useMemo, useState } from 'react';
import { resolveDashboardMenuKeys } from '@/lib/dashboard-menu';

/** selectedKeys + openKeys cho sidebar; tự mở submenu «Học tập» khi vào route con. */
export function useDashboardMenuState(pathname: string) {
  const menuKeys = useMemo(() => resolveDashboardMenuKeys(pathname ?? ''), [pathname]);
  const [openKeys, setOpenKeys] = useState<string[]>(menuKeys.openKeys);

  useEffect(() => {
    setOpenKeys((prev) => {
      const merged = new Set([...prev, ...menuKeys.openKeys]);
      return Array.from(merged);
    });
  }, [menuKeys.openKeys]);

  return {
    selectedKeys: menuKeys.selectedKeys,
    openKeys,
    onOpenChange: setOpenKeys,
  };
}
