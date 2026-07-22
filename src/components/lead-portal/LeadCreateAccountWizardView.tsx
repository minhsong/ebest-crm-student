import Link from "next/link";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Steps } from "antd";
import type { FormInstance } from "antd";

import { PhoneInputField } from "@/components/phone-input";
import { LeadPortalPasswordFields } from "@/components/lead-portal/LeadPortalPasswordFields";
import {
  LEAD_REGISTER_STEP_TITLES,
  type LeadRegisterWizardStep,
} from "@/lib/lead-portal/register-wizard";
import { LeadPortalShell } from "./LeadPortalShell";
import type { LeadCreateAccountFormValues } from "./lead-create-account.types";

type Props = {
  form: FormInstance<LeadCreateAccountFormValues>;
  title: string;
  description: string;
  step: LeadRegisterWizardStep;
  isSelfServe: boolean;
  isGoogleComplete: boolean;
  loading: boolean;
  loginKeyWarning: string | null;
  loginKeyWarningAction: "login" | "contact_support" | null;
  submitError: string | null;
  submitErrorAction: "login" | "contact_support" | null;
  onFinish: (values: LeadCreateAccountFormValues) => void;
  onPrecheck: (field: "email" | "phone") => void;
  onBack: () => void;
  onChooseOther: () => void;
  onNext: () => void;
};

function LoginAction() {
  return (
    <Link href="/login?mode=lead">
      <Button size="small" type="primary">
        Đăng nhập
      </Button>
    </Link>
  );
}

export function LeadCreateAccountWizardView({
  form,
  title,
  description,
  step,
  isSelfServe,
  isGoogleComplete,
  loading,
  loginKeyWarning,
  loginKeyWarningAction,
  submitError,
  submitErrorAction,
  onFinish,
  onPrecheck,
  onBack,
  onChooseOther,
  onNext,
}: Props) {
  const stepItems = isGoogleComplete
    ? [{ title: "Thông tin" }, { title: "Mật khẩu" }]
    : [
        { title: LEAD_REGISTER_STEP_TITLES[1] },
        { title: LEAD_REGISTER_STEP_TITLES[2] },
      ];

  return (
    <LeadPortalShell
      title={isGoogleComplete ? "Hoàn thiện đăng ký Google" : title}
      description={
        isGoogleComplete
          ? "Email đã xác minh bởi Google. Nhập SĐT, họ tên và tạo mật khẩu để mở tài khoản."
          : description
      }
      maxWidthClass="max-w-lg"
    >
      {!isGoogleComplete ? (
        <>
          <Steps
            current={step - 1}
            items={stepItems}
            size="small"
            className="lead-register-steps mb-6"
            responsive
          />
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            {LEAD_REGISTER_STEP_TITLES[step]}
          </h2>
        </>
      ) : (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Đăng ký nhanh bằng Google"
          description="Email được khóa theo tài khoản Google. Bạn vẫn cần tạo mật khẩu để đăng nhập bằng email sau này."
        />
      )}

      {loginKeyWarning ? (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message={loginKeyWarning}
          action={
            loginKeyWarningAction === "login" ? <LoginAction /> : undefined
          }
        />
      ) : null}
      {submitError ? (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message={submitError}
          action={submitErrorAction === "login" ? <LoginAction /> : undefined}
        />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <div
          className={
            isGoogleComplete || step === 1
              ? "rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5"
              : "hidden"
          }
        >
          {isSelfServe || isGoogleComplete ? (
            <Form.Item
              name="displayName"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                maxLength={255}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
            getValueFromEvent={(value: string | undefined) => value}
          >
            <PhoneInputField
              placeholder="0901234567"
              onBlur={() => onPrecheck("phone")}
            />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              placeholder="email@example.com"
              autoComplete="email"
              maxLength={255}
              disabled={isGoogleComplete}
              onBlur={() => onPrecheck("email")}
            />
          </Form.Item>
          {!isGoogleComplete ? (
            <p className="mb-0 text-xs text-gray-500">
              SĐT và email dùng để đăng nhập cổng thi thử — giống thông tin liên
              hệ khi đăng ký thi online.
            </p>
          ) : null}
        </div>

        <div
          className={
            isGoogleComplete || step === 2
              ? `rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5 ${
                  isGoogleComplete ? "mt-4" : ""
                }`
              : "hidden"
          }
        >
          <LeadPortalPasswordFields
            passwordLabel={isGoogleComplete ? "Tạo mật khẩu" : "Mật khẩu"}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!isGoogleComplete && step === 2 ? (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Quay lại
            </Button>
          ) : null}
          {isSelfServe ? (
            <Button icon={<ArrowLeftOutlined />} onClick={onChooseOther}>
              Chọn cách khác
            </Button>
          ) : null}
          {!isGoogleComplete && step === 1 ? (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              onClick={onNext}
              block
              className="sm:!w-auto"
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="sm:!flex-1"
            >
              {isGoogleComplete
                ? "Hoàn tất đăng ký Google"
                : isSelfServe
                  ? "Hoàn tất đăng ký"
                  : "Tạo tài khoản"}
            </Button>
          )}
        </div>
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Đã có tài khoản?{" "}
        <Link
          href="/login?mode=lead"
          className="font-medium text-orange-600 hover:underline"
        >
          Đăng nhập
        </Link>
        {" · "}
        <Link
          href="/mock-test-online"
          className="text-orange-600 hover:underline"
        >
          Thi thử online
        </Link>
      </p>
    </LeadPortalShell>
  );
}
