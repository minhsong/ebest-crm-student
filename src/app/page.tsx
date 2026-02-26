import Link from 'next/link';

/**
 * Trang chủ: hướng dẫn hoặc redirect.
 * Sau này có thể mở rộng thành dashboard / landing.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-800">
        Ebest English - Student Portal
      </h1>
      <p className="max-w-md text-gray-600">
        Để hoàn thiện thông tin, vui lòng sử dụng link được gửi từ trung tâm
        (có dạng: .../complete-profile?token=...).
      </p>
      <p className="text-sm text-gray-500">
        Nếu bạn chưa nhận được link, vui lòng liên hệ Fanpage E-best English.
      </p>
    </div>
  );
}
