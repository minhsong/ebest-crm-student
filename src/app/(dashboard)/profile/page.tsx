'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Form, Input, Button, Alert, App, Avatar } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader, PageCard, LoadingState } from '@/components/layout';

type LoginKeyType = 'email' | 'phone';

interface MeCustomer {
  id?: number;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  emergencyContact?: string;
  emergencyContactRelationship?: string;
  emergencyPhone?: string;
  loginKeyType?: LoginKeyType;
  avatarUrl?: string | null;
}

export default function ProfilePage() {
  const { fetchWithAuth, setAuth, accessToken } = useAuth();
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginKeyType, setLoginKeyType] = useState<LoginKeyType | undefined>();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { message: antMessage } = App.useApp();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/me');
      const data = await res.json().catch(() => ({}));
      const payload: MeCustomer | undefined = data?.customer ?? data;
      if (!res.ok) {
        setError(data?.message ?? 'Không tải được thông tin.');
        return;
      }
      if (payload) {
        setLoginKeyType(payload.loginKeyType);
        setAvatarUrl(payload.avatarUrl ?? null);
        form.setFieldsValue({
          firstName: payload.firstName ?? '',
          lastName: payload.lastName ?? '',
          nickname: payload.nickname ?? '',
          primaryEmail: payload.primaryEmail ?? '',
          primaryPhone: payload.primaryPhone ?? '',
          emergencyContact: payload.emergencyContact ?? '',
          emergencyContactRelationship: payload.emergencyContactRelationship ?? '',
          emergencyPhone: payload.emergencyPhone ?? '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, form]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onFinish = useCallback(
    async (values: Record<string, string>) => {
      setSaving(true);
      setError(null);
      try {
        const body: Record<string, string> = { ...values };
        if (loginKeyType === 'email') delete body.primaryEmail;
        if (loginKeyType === 'phone') delete body.primaryPhone;
        const res = await fetchWithAuth('/api/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'Cập nhật thất bại.');
          return;
        }
        antMessage.success('Đã cập nhật thông tin.');
        const updated = data?.customer ?? data;
        if (accessToken && updated?.firstName != null) {
          const fullName = [updated.firstName, updated.lastName].filter(Boolean).join(' ').trim() || 'Học viên';
          setAuth(accessToken, {
            id: updated.id ?? 0,
            fullName,
            primaryEmail: updated.primaryEmail,
            primaryPhone: updated.primaryPhone,
          });
        }
      } finally {
        setSaving(false);
      }
    },
    [fetchWithAuth, antMessage, loginKeyType, accessToken, setAuth]
  );

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        antMessage.warning('Vui lòng chọn file ảnh (JPEG, PNG, GIF, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        antMessage.warning('Kích thước file tối đa 5MB.');
        return;
      }
      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetchWithAuth('/api/me/avatar', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          antMessage.error(data?.message ?? 'Tải ảnh lên thất bại.');
          return;
        }
        const url = data?.url ?? data?.data?.url;
        if (url) setAvatarUrl(url);
        antMessage.success('Đã cập nhật ảnh đại diện.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setUploadingAvatar(false);
      }
    },
    [fetchWithAuth, antMessage]
  );

  if (loading) {
    return <LoadingState tip="Đang tải thông tin..." />;
  }

  return (
    <>
      <PageHeader
        title="Thông tin cá nhân"
        description="Xem và cập nhật thông tin của bạn. Trường dùng để đăng nhập không thể thay đổi."
      />
      <PageCard>
        {error && (
          <Alert type="error" message={error} className="mb-4" showIcon />
        )}

        <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar
              size={96}
              src={avatarUrl ?? undefined}
              icon={!avatarUrl ? <UserOutlined /> : undefined}
              className="border-2 border-gray-200"
            />
            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-600 p-2 text-white shadow hover:bg-blue-700">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              <CameraOutlined className="block" />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-sm text-gray-500">
              Ảnh đại diện (tối đa 5MB, JPEG/PNG/GIF/WebP)
            </span>
            {uploadingAvatar && (
              <div className="mt-1 text-sm text-blue-600">Đang tải lên...</div>
            )}
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="firstName" label="Họ" rules={[{ required: true, message: 'Vui lòng nhập họ' }]}>
            <Input placeholder="Họ" />
          </Form.Item>
          <Form.Item name="lastName" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Tên" />
          </Form.Item>
          <Form.Item name="nickname" label="Tên gọi / Tên tiếng Anh">
            <Input placeholder="VD: Alex, Mary" />
          </Form.Item>
          <Form.Item
            name="primaryEmail"
            label="Email"
            extra={loginKeyType === 'email' ? 'Dùng làm tên đăng nhập, không thể thay đổi.' : undefined}
          >
            <Input type="email" placeholder="Email" disabled={loginKeyType === 'email'} />
          </Form.Item>
          <Form.Item
            name="primaryPhone"
            label="Số điện thoại"
            extra={loginKeyType === 'phone' ? 'Dùng làm tên đăng nhập, không thể thay đổi.' : undefined}
          >
            <Input placeholder="Số điện thoại" disabled={loginKeyType === 'phone'} />
          </Form.Item>
          <Form.Item name="emergencyContact" label="Người liên hệ khẩn cấp">
            <Input placeholder="Họ tên" />
          </Form.Item>
          <Form.Item name="emergencyContactRelationship" label="Mối quan hệ">
            <Input placeholder="VD: Bố, mẹ, vợ/chồng" />
          </Form.Item>
          <Form.Item name="emergencyPhone" label="SĐT liên hệ khẩn cấp">
            <Input placeholder="Số điện thoại" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </PageCard>
    </>
  );
}
