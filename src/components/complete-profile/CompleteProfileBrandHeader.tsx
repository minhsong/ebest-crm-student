'use client';

import { APP_BRAND, EBEST_BRAND_ORANGE, FANPAGE_URL } from '@/lib/ui-constants';

const BULLETS = [
  `Thông tin của bạn được ${APP_BRAND} bảo mật và chỉ phục vụ quản lý đào tạo, chăm sóc học viên.`,
  'Vui lòng điền chính xác để trung tâm hỗ trợ bạn nhanh chóng khi cần.',
];

/**
 * Dải cam trên cùng trong Card — cùng nhận diện với cột hướng dẫn trang đăng nhập.
 */
export function CompleteProfileBrandHeader() {
  return (
    <div
      className="border-b border-white/25 px-4 py-4 sm:px-6"
      style={{ backgroundColor: EBEST_BRAND_ORANGE }}
    >
      <h3 className="mb-2 text-sm font-semibold text-white">
        Thông tin dành cho học viên
      </h3>
      <ul className="mb-0 list-outside space-y-2 pl-4 text-sm leading-relaxed text-white">
        {BULLETS.map((item, i) => (
          <li key={i} className="marker:text-white/50">
            {item}
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-3 text-xs leading-relaxed text-white/90">
        Cần hỗ trợ? Liên hệ trung tâm {APP_BRAND} hoặc{' '}
        <a
          href={FANPAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-white underline decoration-white/50 underline-offset-2 hover:text-white hover:decoration-white"
        >
          Fanpage chính thức
        </a>
        .
      </p>
    </div>
  );
}
