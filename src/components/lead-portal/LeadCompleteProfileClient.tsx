'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, App, Button, Form, Input, Steps } from 'antd';
import { LeadPortalShell } from '@/components/lead-portal/LeadPortalShell';
import {
  completeLeadProfile,
  fetchLeadProfile,
} from '@/lib/lead-portal/client-api';
import { isLeadPortalUnauthorizedError } from '@/lib/lead-portal/errors';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';
import type { LeadProfile } from '@/lib/lead-portal/types';

type FormValues = {
  displayName: string;
};

/**
 * Sau đăng ký cơ bản + login: bắt buộc hoàn thiện hồ sơ trước layout
 * (pattern Steps giống complete-profile HV).
 */
export function LeadCompleteProfileClient() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchLeadProfile();
        if (cancelled) return;
        if (next.profileCompleted) {
          router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
          return;
        }
        setProfile(next);
        form.setFieldsValue({
          displayName: next.displayName ?? '',
        });
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        if (isLeadPortalUnauthorizedError(e)) {
          router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
          return;
        }
        message.error(
          e instanceof Error ? e.message : 'Không tải được hồ sơ.',
        );
        router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form, message, router]);

  const onFinish = useCallback(
    async (values: FormValues) => {
      setSubmitting(true);
      try {
        await completeLeadProfile({
          displayName: values.displayName.trim(),
        });
        message.success('Đã hoàn thiện hồ sơ. Chào mừng bạn đến cổng Ebest!');
        router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
      } catch (e) {
        if (isLeadPortalUnauthorizedError(e)) {
          router.replace(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
          return;
        }
        message.error(
          e instanceof Error ? e.message : 'Không hoàn thiện được hồ sơ.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [message, router],
  );

  if (loading || !profile) {
    return (
      <LeadPortalShell title="Hoàn thiện hồ sơ" description="Đang tải…">
        <Alert type="info" showIcon message="Đang tải thông tin tài khoản…" />
      </LeadPortalShell>
    );
  }

  return (
    <LeadPortalShell
      title="Hoàn thiện hồ sơ"
      description="Bạn đã đăng ký thành công. Vui lòng xác nhận thông tin trước khi dùng cổng thi thử."
      maxWidthClass="max-w-lg"
    >
      <Steps
        size="small"
        current={step - 1}
        className="mb-6"
        items={[
          { title: 'Xác nhận liên hệ' },
          { title: 'Hoàn tất' },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        {step === 1 ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="Tài khoản đã tạo — chưa hoàn thiện hồ sơ"
              description="Điền đúng họ tên để trung tâm liên hệ và hiển thị trên kết quả thi."
            />
            <Form.Item label="Số điện thoại">
              <Input value={profile.phoneE164} disabled />
            </Form.Item>
            <Form.Item label="Email">
              <Input value={profile.email || '—'} disabled />
            </Form.Item>
            <Form.Item
              name="displayName"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input placeholder="Nguyễn Văn A" maxLength={255} />
            </Form.Item>
            <Button
              type="primary"
              block
              onClick={async () => {
                try {
                  await form.validateFields(['displayName']);
                  setStep(2);
                } catch {
                  // validation UI
                }
              }}
            >
              Tiếp tục
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
            <Alert
              type="success"
              showIcon
              className="mb-4"
              message="Sẵn sàng vào cổng Ebest"
              description="Xác nhận để mở đầy đủ menu thi thử, kết quả và khám phá khóa học."
            />
            <p className="mb-4 text-sm text-gray-600">
              Họ tên:{' '}
              <strong>{form.getFieldValue('displayName') || '—'}</strong>
              <br />
              SĐT: <strong>{profile.phoneE164}</strong>
              <br />
              Email: <strong>{profile.email || '—'}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setStep(1)}>Quay lại</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                className="flex-1"
              >
                Hoàn tất và vào cổng
              </Button>
            </div>
          </div>
        )}
      </Form>
    </LeadPortalShell>
  );
}
