import type { ThemeConfig } from 'antd';
import { EBEST_BRAND_ORANGE, HEADER_HEIGHT } from '@/lib/ui-constants';

/** Hover / active menu sidebar — cùng hue với EBEST_BRAND_ORANGE */
const MENU_HOVER_BG = 'rgba(227, 83, 33, 0.08)';
const MENU_ACTIVE_BG = 'rgba(227, 83, 33, 0.12)';

/**
 * Theme ConfigProvider cho layout dashboard (nền layout + menu sidebar trắng, mục chọn cam).
 * Hằng số module — tránh tạo object mới mỗi lần render.
 */
export const dashboardAntdTheme: ThemeConfig = {
  token: {
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
    borderRadius: 6,
  },
  components: {
    /**
     * Tránh mặc định antd ~50px; padding ngang base 8px (thấy trong rule `.ant-layout-header`).
     * Từ `sm:` tăng lên 24px qua class `sm:px-6` trên `DashboardHeader`.
     */
    Layout: {
      headerHeight: HEADER_HEIGHT,
      headerPadding: '0 8px',
      headerBg: '#ffffff',
      headerColor: 'rgba(0, 0, 0, 0.88)',
    },
    Menu: {
      itemBg: '#ffffff',
      itemColor: 'rgba(0, 0, 0, 0.88)',
      itemHoverBg: MENU_HOVER_BG,
      itemActiveBg: MENU_ACTIVE_BG,
      itemSelectedBg: EBEST_BRAND_ORANGE,
      itemSelectedColor: '#ffffff',
      subMenuItemBg: '#ffffff',
      itemBorderRadius: 6,
    },
  },
};
