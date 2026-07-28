import Link from "next/link";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Steps } from "antd";
import type { FormInstance } from "antd";

import { PhoneInputField } from "@/components/phone-input";
import { validatePhone } from "@/lib/complete-profile/validation";
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
    <Link href="/login">
      <Button size="small" type="primary">
        ÄÄƒng nháº­p
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
    ? [{ title: "ThÃ´ng tin" }, { title: "Máº­t kháº©u" }]
    : [
        { title: LEAD_REGISTER_STEP_TITLES[1] },
        { title: LEAD_REGISTER_STEP_TITLES[2] },
      ];

  return (
    <LeadPortalShell
      title={isGoogleComplete ? "HoÃ n thiá»‡n Ä‘Äƒng kÃ½ Google" : title}
      description={
        isGoogleComplete
          ? "Email Ä‘Ã£ xÃ¡c minh bá»Ÿi Google. Nháº­p SÄT, há» tÃªn vÃ  táº¡o máº­t kháº©u Ä‘á»ƒ má»Ÿ tÃ i khoáº£n."
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
          message="ÄÄƒng kÃ½ nhanh báº±ng Google"
          description="Email Ä‘Æ°á»£c khÃ³a theo tÃ i khoáº£n Google. Báº¡n váº«n cáº§n táº¡o máº­t kháº©u Ä‘á»ƒ Ä‘Äƒng nháº­p báº±ng email sau nÃ y."
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
              label="Há» vÃ  tÃªn"
              rules={[{ required: true, message: "Vui lÃ²ng nháº­p há» tÃªn" }]}
            >
              <Input
                placeholder="Nguyá»…n VÄƒn A"
                autoComplete="name"
                maxLength={255}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="phone"
            label="Sá»‘ Ä‘iá»‡n thoáº¡i"
            rules={[
              { required: true, message: "Vui lÃ²ng nháº­p SÄT" },
              { validator: validatePhone },
            ]}
            getValueFromEvent={(value: string | undefined) => value}
          >
            <PhoneInputField placeholder="0901234567" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lÃ²ng nháº­p email" },
              { type: "email", message: "Email khÃ´ng há»£p lá»‡" },
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
              Email lÃ  tÃ i khoáº£n Ä‘Äƒng nháº­p. Sá»‘ Ä‘iá»‡n thoáº¡i lÃ  thÃ´ng tin liÃªn há»‡
              (báº¯t buá»™c, Ä‘Ãºng Ä‘á»‹nh dáº¡ng VN).
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
            passwordLabel={isGoogleComplete ? "Táº¡o máº­t kháº©u" : "Máº­t kháº©u"}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!isGoogleComplete && step === 2 ? (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Quay láº¡i
            </Button>
          ) : null}
          {isSelfServe ? (
            <Button icon={<ArrowLeftOutlined />} onClick={onChooseOther}>
              Chá»n cÃ¡ch khÃ¡c
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
              Tiáº¿p tá»¥c
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
                ? "HoÃ n táº¥t Ä‘Äƒng kÃ½ Google"
                : isSelfServe
                  ? "HoÃ n táº¥t Ä‘Äƒng kÃ½"
                  : "Táº¡o tÃ i khoáº£n"}
            </Button>
          )}
        </div>
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ÄÃ£ cÃ³ tÃ i khoáº£n?{" "}
        <Link
          href="/login"
          className="font-medium text-orange-600 hover:underline"
        >
          ÄÄƒng nháº­p
        </Link>
        {" Â· "}
        <Link
          href="/mock-test-online"
          className="text-orange-600 hover:underline"
        >
          Thi thá»­ online
        </Link>
      </p>
    </LeadPortalShell>
  );
}
