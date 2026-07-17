'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, App, Button, Form, Input, Steps } from 'antd';
import { LeadPortalShell } from '@/components/lead-portal/LeadPortalShell';
import { PublicMockTestProfileFields } from '@/components/public-mock-test/PublicMockTestProfileFields';
import {
  completeLeadProfile,
  fetchLeadProfile,
} from '@/lib/lead-portal/client-api';
import { isLeadPortalUnauthorizedError } from '@/lib/lead-portal/errors';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';
import type { LeadProfile } from '@/lib/lead-portal/types';
import type { PublicRegistrationOptions } from '@/lib/public-mock-test/types';
import { collectPublicProfilePayload } from '@/lib/public-mock-test/profile-payload';

type FormValues = {
  displayName: string;
  tagsByCategory?: Record<string, number | number[]>;
  universityOther?: string;
  consultationNote?: string;
  expectedScore?: number;
};

type Props = {
  initialProfileOptions: PublicRegistrationOptions | null;
  profileOptionsError?: string | null;
};

/**
 * Sau đăng ký cơ bản + login: hoàn thiện hồ sơ (liên hệ + tag phân tích lead) trước layout.
 */
export function LeadCompleteProfileClient({
  initialProfileOptions,
  profileOptionsError = null,
}: Props) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

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
        // Bước 3 không mount field bước 1–2 — lấy full store (preserve).
        const allValues = {
          ...form.getFieldsValue(true),
          ...values,
        } as FormValues;
        const displayName = allValues.displayName?.trim();
        if (!displayName) {
          message.error('Vui lòng nhập họ tên');
          setStep(1);
          return;
        }
        const profilePayload = collectPublicProfilePayload(allValues);
        await completeLeadProfile({
          displayName,
          ...profilePayload,
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
    [form, message, router],
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
      description="Xác nhận thông tin và mô tả về bạn để Ebest tư vấn phù hợp hơn."
      maxWidthClass="max-w-lg"
    >
      <Steps
        size="small"
        current={step - 1}
        className="mb-6"
        items={[
          { title: 'Liên hệ' },
          { title: 'Mô tả về bạn' },
          { title: 'Hoàn tất' },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        preserve
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
        ) : null}

        {step === 2 ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
            <PublicMockTestProfileFields
              options={initialProfileOptions}
              optionsError={profileOptionsError}
              includeExpectedScore
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => setStep(1)}>Quay lại</Button>
              <Button type="primary" className="flex-1" onClick={() => setStep(3)}>
                Tiếp tục
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
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
              <Button onClick={() => setStep(2)}>Quay lại</Button>
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
        ) : null}
      </Form>
    </LeadPortalShell>
  );
}
