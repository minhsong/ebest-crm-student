'use client';

import { Suspense, useCallback } from 'react';
import { Form, Input, Button, Alert, App } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageCard, PageHeader, LoadingState } from '@/components/layout';
import { useRequireLeadSession } from '@/hooks/use-lead-session';
import { useChangePassword } from '@/hooks/use-change-password';
import { leadPortalFormRules } from '@/lib/lead-portal/validation';

function LeadChangePasswordForm() {
  const router = useRouter();
  const { message } = App.useApp();
  const { checking, ready } = useRequireLeadSession();
  const { loading, error, done, submit, reset } = useChangePassword({
    endpoint: '/api/auth/lead/change-password',
  });

  const onFinish = useCallback(
    async (values: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      const result = await submit(values.currentPassword, values.newPassword);
      if (result.ok) {
        message.success(result.message ?? 'Đã đổi mật khẩu thành công.');
        router.push('/lead/tests');
      }
    },
    [submit, message, router],
  );

  if (checking || !ready) {
    return <LoadingState tip="Đang kiểm tra phiên…" />;
  }

  return (
    <>
      <PageHeader
        title="Đổi mật khẩu"
        description="Cập nhật mật khẩu tài khoản thí sinh thi thử online."
      />
      <PageCard>
        {done ? (
          <Alert
            type="success"
            showIcon
            message="Mật khẩu đã được cập nhật."
            className="mb-4"
          />
        ) : null}
        {error ? <Alert type="error" showIcon message={error} className="mb-4" /> : null}
        {!done ? (
          <Form
            layout="vertical"
            size="large"
            onFinish={onFinish}
            onValuesChange={() => reset()}
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={leadPortalFormRules.password}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Nhập lại mật khẩu mới"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu không khớp'));
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Lưu mật khẩu mới
            </Button>
          </Form>
        ) : (
          <div className="text-center">
            <Link href="/lead/tests">Về kết quả thi thử</Link>
          </div>
        )}
      </PageCard>
    </>
  );
}

export function LeadChangePasswordPageClient() {
  return (
    <Suspense fallback={<LoadingState tip="Đang tải…" />}>
      <LeadChangePasswordForm />
    </Suspense>
  );
}
