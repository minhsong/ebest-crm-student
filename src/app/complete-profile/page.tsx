import { getProfileByToken } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/env';
import { buildPageMetadata } from '@/lib/metadata';
import { TokenError } from '@/components/complete-profile/TokenError';
import { ProfileForm } from '@/components/complete-profile/ProfileForm';
import { AlreadyConfirmedRedirect } from '@/components/complete-profile/AlreadyConfirmedRedirect';
import { App } from 'antd';

export const metadata = buildPageMetadata({
  title: 'Hoàn thiện thông tin',
  description:
    'Điền thông tin cá nhân để hoàn tất hồ sơ học viên Ebest English. Link từ trung tâm.',
  path: '/complete-profile',
});

/**
 * Trang hoàn thiện thông tin (SSR).
 * Data load từ API server để bảo mật; validate token và trả về thông báo nếu invalid.
 */
export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: { token?: string | string[] };
}) {
  const tokenRaw = searchParams.token;
  const token = (typeof tokenRaw === 'string' ? tokenRaw : tokenRaw?.[0])?.trim();

  if (!token) {
    return (
      <TokenError message="Thiếu link xác thực. Vui lòng sử dụng đúng link được gửi từ trung tâm." />
    );
  }

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return (
      <TokenError message="Cấu hình hệ thống chưa đúng. Vui lòng liên hệ quản trị." />
    );
  }

  const { data, error } = await getProfileByToken(apiBaseUrl, token);

  if (error || !data) {
    return <TokenError message={error ?? 'Link không hợp lệ hoặc đã hết hạn.'} />;
  }

  if (data.customer?.confirmed) {
    return <AlreadyConfirmedRedirect />;
  }

  return (
    <App>
      <ProfileForm initialData={data} token={token} />
    </App>
  );
}
