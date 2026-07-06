'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, App } from 'antd';
import { PageCard, PageHeader, LoadingState } from '@/components/layout';
import { useRequireLeadSession } from '@/hooks/use-lead-session';
import { fetchLeadProfile, type LeadProfile } from '@/lib/lead-portal/client-api';

function maskInternalEmail(email: string): string {
  if (email.endsWith('@mto.ebest.internal')) return '—';
  return email;
}

export function LeadProfilePageClient() {
  const { message } = App.useApp();
  const { checking, ready } = useRequireLeadSession();
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeadProfile();
      setProfile(data);
      form.setFieldsValue({ displayName: data.displayName ?? '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (ready) void loadProfile();
  }, [ready, loadProfile]);

  const onFinish = useCallback(
    async (values: { displayName?: string }) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch('/api/lead/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: values.displayName ?? '' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data?.message === 'string' ? data.message : 'Cập nhật thất bại.');
          return;
        }
        setProfile(data as LeadProfile);
        message.success('Đã cập nhật thông tin.');
      } finally {
        setSaving(false);
      }
    },
    [message],
  );

  if (checking || !ready || loading) {
    return <LoadingState tip="Đang tải thông tin…" />;
  }

  return (
    <>
      <PageHeader
        title="Thông tin cá nhân"
        description="Xem và cập nhật thông tin tài khoản thí sinh."
      />
      <PageCard>
        {error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="displayName" label="Tên hiển thị">
            <Input placeholder="Tên bạn muốn hiển thị trên portal" />
          </Form.Item>
          <Form.Item label="Số điện thoại">
            <Input value={profile?.phoneE164 ?? ''} disabled />
          </Form.Item>
          <Form.Item label="Email">
            <Input value={maskInternalEmail(profile?.email ?? '')} disabled />
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
