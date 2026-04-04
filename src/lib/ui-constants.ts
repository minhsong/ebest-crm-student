/**
 * UI constants – Student Portal.
 * Dùng thống nhất cho layout, spacing, tên app.
 */

export const APP_NAME = 'Student Portal';
export const APP_BRAND = 'Ebest English';

/** Cam nhận diện Ebest (sidebar active, CTA, v.v.) */
export const EBEST_BRAND_ORANGE = '#e35321';

/** Fanpage – khi không có link, liên hệ tại đây */
export const FANPAGE_URL = 'https://www.facebook.com/ebestmsvy';

/** Padding content desktop (px) — mobile dùng 12px trong globals `.dashboard-layout-content` */
export const CONTENT_PADDING = 24;
export const CONTENT_PADDING_MOBILE = 12;

/** Max width nội dung form / card (px) */
export const CONTENT_MAX_WIDTH = 640;
export const CONTENT_MAX_WIDTH_WIDE = 960;

/** Chiều cao header (px) – theo react-antd-admin */
export const HEADER_HEIGHT = 48;
/** Chiều cao footer (px) – theo react-antd-admin */
export const FOOTER_HEIGHT = 40;
/** Chiều cao khối logo trong sidebar (px) — đủ cho logo ngang + tagline */
export const SIDEBAR_TITLE_HEIGHT = 68;
/** Sider rộng khi mở (px) — chứa logo og-image */
export const SIDER_WIDTH = 232;
/** Sider rộng khi thu gọn (px) – theo antd-multipurpose-dashboard */
export const SIDER_COLLAPSED_WIDTH = 64;

/**
 * Viewport ≤ giá trị này → drawer menu (khớp `useDashboardMobile`).
 * Gần breakpoint `.dashboard-layout-content` (770px); giữ 769 theo layout cũ antd-multipurpose.
 */
export const DASHBOARD_MOBILE_MAX_WIDTH_PX = 769;
