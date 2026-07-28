'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, App } from 'antd';
import { PageCard, PageHeader, LoadingState } from '@/components/layout';
import { useRequireLeadSession } from '@/hooks/use-lead-session';
import { usePortalSession } from '@/contexts/portal-session-context';
import { getLeadSessionSummary } from '@/lib/portal-auth/portal-session-selectors';
import { leadProfileToClientSessionPayload } from '@/lib/portal-auth/sync-lead-portal-session.util';
import type { LeadProfile } from '@/lib/lead-portal/types';
import type { PortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';

function maskInternalEmail(email: string): string {
  if (email.endsWith('@mto.ebest.internal')) return '—';
  return email;
}

function sessionSummaryToFormProfile(
  summary: PortalLeadSessionSummary,
): LeadProfile {
  return {
    ...summary,
    omniLeadId: '',
  };
}

export function LeadProfilePageClient() {
  const { message } = App.useApp();
  const { checking, ready } = useRequireLeadSession();
  const portal = usePortalSession();
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const summary = getLeadSessionSummary(portal);
    if (!summary) return;
    const seeded = sessionSummaryToFormProfile(summary);
    setProfile(seeded);
    form.setFieldsValue({ displayName: seeded.displayName ?? '' });
  }, [ready, portal, form]);

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
        const updated = data as LeadProfile;
        setProfile(updated);
        portal.setFromPayload(leadProfileToClientSessionPayload(updated));
        message.success('Đã cập nhật thông tin.');
      } finally {
        setSaving(false);
      }
    },
    [message, portal],
  );

  if (checking || !ready || profile == null) {
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
