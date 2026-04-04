'use client';

import { useEffect, useState } from 'react';
import { DASHBOARD_MOBILE_MAX_WIDTH_PX } from '@/lib/ui-constants';

/**
 * true khi viewport ≤ breakpoint dashboard (khớp layout sidebar → drawer).
 */
export function useDashboardMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      `(max-width: ${DASHBOARD_MOBILE_MAX_WIDTH_PX}px)`,
    );
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}
