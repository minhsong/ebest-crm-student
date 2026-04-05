import type { ThemeConfig } from 'antd';
import { EBEST_BRAND_ORANGE } from '@/lib/ui-constants';

/**
 * Theme cho các trang công khai (complete-profile, có thể tái dùng forgot-password).
 * Đồng bộ màu primary với dashboard / đăng nhập.
 */
export const ebestPublicAntdTheme: ThemeConfig = {
  token: {
    colorPrimary: EBEST_BRAND_ORANGE,
    borderRadius: 8,
  },
  components: {
    Steps: {
      colorPrimary: EBEST_BRAND_ORANGE,
    },
  },
};
