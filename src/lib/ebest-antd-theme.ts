import type { ThemeConfig } from 'antd';
import { EBEST_BRAND_ORANGE } from '@/lib/ui-constants';

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
