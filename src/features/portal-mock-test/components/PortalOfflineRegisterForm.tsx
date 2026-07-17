'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Alert, App, Button, Descriptions, Form, Typography } from 'antd';
import { PublicMockTestProfileFields } from '@/components/public-mock-test/PublicMockTestProfileFields';
import { PublicMockTestSessionPicker } from '@/components/public-mock-test/PublicMockTestSessionPicker';
import { collectPublicProfilePayload } from '@/lib/public-mock-test/profile-payload';
import type {
  PublicLocationGroup,
  PublicMockTestFormValues,
  PublicRegisterResponse,
  PublicRegistrationOptions,
} from '@/lib/public-mock-test/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

const { Text, Title } = Typography;

export interface PortalOfflineRegisterFormProps {
  submitEndpoint: string;
  initialLocations: PublicLocationGroup[];
  initialProfileOptions: PublicRegistrationOptions | null;
  contact: {
    displayName: string;
    primaryPhone: string;
    primaryEmail: string;
  };
  sessionsError?: string | null;
  profileOptionsError?: string | null;
}

/** Form offline actor-agnostic — contact read-only, POST qua BFF. */
export function PortalOfflineRegisterForm({
  submitEndpoint,
  initialLocations,
  initialProfileOptions,
  contact,
  sessionsError = null,
  profileOptionsError = null,
}: PortalOfflineRegisterFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PublicMockTestFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<PublicRegisterResponse | null>(null);
  const locations = initialLocations;
  const selectedLocationKey = Form.useWatch('locationKey', form);
  const selectedSessionId = Form.useWatch('sessionId', form);

  const onLocationChange = useCallback(() => {
    form.setFieldValue('sessionId', undefined);
  }, [form]);

  const onFinish = useCallback(
    async (values: PublicMockTestFormValues) => {
      setSubmitting(true);
      try {
        const profile = collectPublicProfilePayload(values);
        const res = await fetch(submitEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: values.sessionId,
            ...profile,
          }),
        });
        const data = (await res.json()) as PublicRegisterResponse & {
          message?: string;
        };
        if (!res.ok) {
          throw new Error(data.message ?? 'Đăng ký thất bại');
        }
        setSuccess(data);
        message.success(data.message);
      } catch (e) {
        message.error(e instanceof Error ? e.message : 'Đăng ký thất bại');
      } finally {
        setSubmitting(false);
      }
    },
    [message, submitEndpoint],
  );

  if (success) {
    return (
      <div className="ebest-mock-test-widget">
        <Alert type="success" showIcon message={success.message} />
        <Text className="mock-test-meta-text mt-2 block text-sm">
          Mã đăng ký #{success.registrationId}
        </Text>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={PORTAL_MOCK_TEST_ROUTES.results}>
            <Button type="primary">Xem lịch sử thi thử</Button>
          </Link>
          <Link href={PORTAL_MOCK_TEST_ROUTES.hub}>
            <Button>Về Thi thử</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ebest-mock-test-widget">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
        preserve
      >
        {sessionsError ? (
          <Alert type="error" showIcon message={sessionsError} className="!mb-4" />
        ) : null}

        <Title level={5} className="!mb-3 !mt-0">
          Thông tin tài khoản
        </Title>
        <Descriptions
          size="small"
          column={1}
          bordered
          className="!mb-6"
          items={[
            { key: 'name', label: 'Họ và tên', children: contact.displayName },
            {
              key: 'phone',
              label: 'Số điện thoại',
              children: contact.primaryPhone || '—',
            },
            {
              key: 'email',
              label: 'Email',
              children: contact.primaryEmail || '—',
            },
          ]}
        />
        <Alert
          type="info"
          showIcon
          className="!mb-4"
          message="Ebest dùng SĐT và email tài khoản để xác nhận đăng ký và báo điểm."
        />

        <PublicMockTestSessionPicker
          locations={locations}
          selectedLocationKey={selectedLocationKey}
          onLocationChange={onLocationChange}
        />

        {profileOptionsError ? (
          <Alert
            type="warning"
            showIcon
            message={profileOptionsError}
            className="!mb-4"
          />
        ) : null}

        {initialProfileOptions ? (
          <PublicMockTestProfileFields
            options={initialProfileOptions}
            optionsError={profileOptionsError}
          />
        ) : null}

        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          block
          size="large"
          disabled={!selectedSessionId || locations.length === 0}
          className="mt-2"
        >
          Gửi đăng ký
        </Button>
      </Form>
    </div>
  );
}
