import { getProfileByToken } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/env';
import { TokenError } from '@/components/complete-profile/TokenError';
import { ProfileForm } from '@/components/complete-profile/ProfileForm';
import { App } from 'antd';

/**
 * Trang hoàn thiện thông tin (SSR).
 * Data load từ API server để bảo mật; validate token và trả về thông báo nếu invalid.
 */
export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();

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

  return (
    <App>
      <ProfileForm initialData={data} token={token} />
    </App>
  );
}
