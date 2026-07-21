"use client";

import {
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  Space,
  Typography,
} from "antd";

import { PhoneInputField } from "@/components/phone-input";
import { PublicMockTestProfileFields } from "@/components/public-mock-test/PublicMockTestProfileFields";
import { publicMockTestFormRules } from "@/lib/public-mock-test/validation";
import { buildPortalLoginHref } from "@/lib/portal-auth/post-auth-return-url";
import type { MockTestOnlineRegisterFormValues } from "@/lib/public-mock-test-online/types";
import type { PublicRegistrationOptions } from "@/lib/public-mock-test/types";
import { MockTestOnlineIntakeErrorAlert } from "./MockTestOnlineIntakeErrorAlert";
import {
  type MockTestOnlineInitialContact,
  useMockTestOnlineIntakeForm,
} from "./useMockTestOnlineIntakeForm";

const { Text } = Typography;
const LOGIN_HREF = buildPortalLoginHref({ returnUrl: "/mock-test-online" });

type Props = {
  profileOptions: PublicRegistrationOptions | null;
  profileOptionsError: string | null;
  initialContact: MockTestOnlineInitialContact | null;
  fanpageUrl: string;
};

export function MockTestOnlinePhoneIntakeForm({
  profileOptions,
  profileOptionsError,
  initialContact,
  fanpageUrl,
}: Props) {
  const { form, submitting, intakeError, onFinish, onValuesChange, retry } =
    useMockTestOnlineIntakeForm(initialContact);

  return (
    <Form<MockTestOnlineRegisterFormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      initialValues={{
        displayName: initialContact?.displayName ?? "",
        primaryPhone: initialContact?.primaryPhone ?? "",
        primaryEmail: initialContact?.primaryEmail ?? "",
        consentMarketing: false,
        resultDeliveryEmail: false,
      }}
    >
      {intakeError ? (
        <MockTestOnlineIntakeErrorAlert
          error={intakeError}
          loginHref={LOGIN_HREF}
          fanpageUrl={fanpageUrl}
          onRetry={retry}
        />
      ) : null}

      <Text strong className="mock-test-section-title">
        Thông tin liên hệ
      </Text>
      <Form.Item
        name="displayName"
        label="Họ và tên"
        rules={publicMockTestFormRules.displayName}
      >
        <Input placeholder="Nguyễn Văn A" maxLength={255} autoComplete="name" />
      </Form.Item>
      <Form.Item
        name="primaryPhone"
        label="Số điện thoại"
        rules={publicMockTestFormRules.primaryPhone}
        getValueFromEvent={(value: string | undefined) => value}
      >
        <PhoneInputField placeholder="0901234567" />
      </Form.Item>

      <Form.Item
        name="primaryEmail"
        label="Email"
        extra="Email này sẽ được dùng để đăng nhập và xem điểm sau khi thi. Vui lòng kiểm tra kỹ và nhập đúng email bạn đang sử dụng."
        rules={publicMockTestFormRules.primaryEmail}
      >
        <Input
          type="email"
          placeholder="ban@gmail.com"
          maxLength={255}
          autoComplete="email"
          inputMode="email"
        />
      </Form.Item>

      <PublicMockTestProfileFields
        options={profileOptions}
        optionsError={profileOptionsError}
        includeExpectedScore={false}
      />

      <Divider className="!my-4" />

      <Form.Item
        name="resultDeliveryEmail"
        valuePropName="checked"
        className="!mb-3"
      >
        <Checkbox>
          Nhận kết quả qua email (cần xác nhận email sau khi hoàn thành bài thi)
        </Checkbox>
      </Form.Item>

      <Form.Item
        name="consentMarketing"
        valuePropName="checked"
        className="!mb-4"
        rules={[
          {
            validator: (_, value) =>
              value
                ? Promise.resolve()
                : Promise.reject(
                    new Error("Vui lòng đồng ý điều khoản nhận thông tin."),
                  ),
          },
        ]}
      >
        <Checkbox>
          Tôi đồng ý nhận thông tin tư vấn và ưu đãi từ Ebest.
        </Checkbox>
      </Form.Item>

      <Form.Item className="!mb-0">
        <Space direction="vertical" className="w-full" size="small">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
          >
            Tiếp tục — chọn bài thi
          </Button>
          <Text type="secondary" className="text-xs block text-center">
            Bước tiếp theo: chọn bài thi, xác minh Zalo và làm bài.
          </Text>
        </Space>
      </Form.Item>
    </Form>
  );
}
