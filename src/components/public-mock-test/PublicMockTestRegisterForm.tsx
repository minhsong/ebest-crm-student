"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, App, Button, Empty, Form, Typography } from "antd";
import { executeRecaptchaV3 } from "@/lib/public-mock-test/recaptcha";
import type {
  PublicLocationGroup,
  PublicMockTestFormValues,
  PublicRegisterResponse,
  PublicRegistrationOptions,
} from "@/lib/public-mock-test/types";
import { collectPublicProfilePayload } from "@/lib/public-mock-test/profile-payload";
import { PublicMockTestContactFields } from "./PublicMockTestContactFields";
import { PublicMockTestProfileFields } from "./PublicMockTestProfileFields";
import { PublicMockTestSessionPicker } from "./PublicMockTestSessionPicker";
import { MOCK_TEST_LANDING_SEO } from "@/lib/public-mock-test/seo.constants";

const { Text, Title } = Typography;

export interface PublicMockTestRegisterFormProps {
  initialLocations: PublicLocationGroup[];
  initialProfileOptions: PublicRegistrationOptions | null;
  sessionsError?: string | null;
  profileOptionsError?: string | null;
  initialContact?: {
    displayName?: string;
    primaryPhone?: string;
    primaryEmail?: string;
  } | null;
}

export function PublicMockTestRegisterForm({
  initialLocations,
  initialProfileOptions,
  sessionsError = null,
  profileOptionsError = null,
  initialContact = null,
}: PublicMockTestRegisterFormProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<PublicMockTestFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<PublicRegisterResponse | null>(null);
  const locations = initialLocations;
  const selectedLocationKey = Form.useWatch("locationKey", form);
  const selectedSessionId = Form.useWatch("sessionId", form);

  const onLocationChange = useCallback(() => {
    form.setFieldValue("sessionId", undefined);
  }, [form]);

  const onFinish = useCallback(
    async (values: PublicMockTestFormValues) => {
      setSubmitting(true);
      try {
        const recaptchaToken = await executeRecaptchaV3();
        const profile = collectPublicProfilePayload(values);
        const res = await fetch("/api/public/mock-test/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: values.sessionId,
            displayName: values.displayName.trim(),
            primaryPhone: values.primaryPhone?.trim(),
            primaryEmail: values.primaryEmail.trim(),
            recaptchaToken,
            ...profile,
          }),
        });
        const data = (await res.json()) as PublicRegisterResponse & {
          message?: string;
        };
        if (!res.ok) {
          throw new Error(data.message ?? "Đăng ký thất bại");
        }
        setSuccess(data);
        message.success(data.message);
      } catch (e) {
        message.error(e instanceof Error ? e.message : "Đăng ký thất bại");
      } finally {
        setSubmitting(false);
      }
    },
    [message],
  );

  if (success) {
    return (
      <div className="ebest-mock-test-widget">
        <Alert type="success" showIcon message={success.message} />
        <Text className="mock-test-meta-text mt-2 block text-sm">
          Mã đăng ký #{success.registrationId}
        </Text>
        <Link
          href={`/lead/create-account?registrationId=${success.registrationId}`}
          className="mt-3 inline-block"
        >
          <Button type="primary">Tạo tài khoản theo dõi buổi thi</Button>
        </Link>
        <Button
          type="link"
          className="!px-0 mt-2 block"
          onClick={() => setSuccess(null)}
        >
          Đăng ký thêm buổi khác
        </Button>
      </div>
    );
  }
  if (sessionsError && locations.length === 0) {
    return (
      <div className="ebest-mock-test-widget">
        <Alert
          type="error"
          showIcon
          message={sessionsError}
          action={
            <Button size="small" onClick={() => router.refresh()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }
  if (!locations.length) {
    return (
      <div className="ebest-mock-test-widget">
        <Empty description="Hiện chưa có buổi thi mở đăng ký." />
      </div>
    );
  }

  return (
    <div className="ebest-mock-test-widget">
      <Title level={3} className="mock-test-page-title !mb-1 !mt-0">
        {MOCK_TEST_LANDING_SEO.widgetTitle}
      </Title>
      <Text className="mock-test-intro-text">
        {MOCK_TEST_LANDING_SEO.widgetIntro}
      </Text>
      {sessionsError ? (
        <Alert
          type="warning"
          showIcon
          message={sessionsError}
          className="!mb-4"
        />
      ) : null}
      <Form
        form={form}
        initialValues={{
          displayName: initialContact?.displayName,
          primaryPhone: initialContact?.primaryPhone,
          primaryEmail: initialContact?.primaryEmail,
        }}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
        validateTrigger="onBlur"
        size="middle"
      >
        <PublicMockTestSessionPicker
          locations={locations}
          selectedLocationKey={selectedLocationKey}
          onLocationChange={onLocationChange}
        />
        {selectedSessionId ? (
          <>
            <PublicMockTestContactFields
              submitting={submitting}
              showSubmit={false}
            />
            <PublicMockTestProfileFields
              options={initialProfileOptions}
              optionsError={profileOptionsError}
            />
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
            >
              Gửi đăng ký
            </Button>
          </>
        ) : (
          <Text className="mock-test-hint-text">
            Chọn cơ sở và lịch thi để tiếp tục nhập thông tin liên hệ.
          </Text>
        )}
      </Form>
    </div>
  );
}
