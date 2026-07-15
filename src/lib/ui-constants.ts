/**
 * UI constants – Student Portal.
 * Dùng thống nhất cho layout, spacing, tên app.
 *
 * Contact URLs (Messenger / Zalo): SSOT = CRM `portal_site_links`
 * (Portal học viên → Catalog khóa học → tab Liên kết site).
 * Các hằng bên dưới chỉ là fallback offline khi CRM chưa tải.
 */

export const APP_NAME = 'Student Portal';
export const APP_BRAND = 'Ebest English';

/** Cam nhận diện Ebest (sidebar active, CTA, v.v.) */
export const EBEST_BRAND_ORANGE = '#e35321';

/** Fallback — đồng bộ DEFAULT CRM `portal_site_links` (vi-VN). */
export const MESSENGER_CHAT_URL = 'https://www.messenger.com/t/ebestmsvy';
export const FANPAGE_PROFILE_URL = 'https://www.facebook.com/ebestmsvy';
/** @deprecated Ưu tiên `usePortalContactLinks().messengerUrl` / CRM siteLinks. */
export const FANPAGE_URL = MESSENGER_CHAT_URL;
export const ZALO_OA_CHAT_URL = 'https://zalo.me/ebestenglish';

/** Padding content desktop (px) — mobile dùng 8px trong globals `.dashboard-layout-content` */
export const CONTENT_PADDING = 24;
export const CONTENT_PADDING_MOBILE = 8;

/** Max width nội dung form / card (px) */
export const CONTENT_MAX_WIDTH = 640;
export const CONTENT_MAX_WIDTH_WIDE = 960;

/** Chiều cao header (px) – theo react-antd-admin */
export const HEADER_HEIGHT = 48;
/** Mép trên viewport khi pin timer/lượt nghe lúc scroll (px) — dưới top nav dashboard. */
export const QUIZ_ATTEMPT_STICKY_VIEWPORT_TOP = 50;
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
