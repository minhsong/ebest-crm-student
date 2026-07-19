"use client";

import { useState } from "react";
import { App, Button, Checkbox, Form, Input } from "antd";

import { PhoneInputField } from "@/components/phone-input";
import { googleFinalizeMockTestFast } from "@/lib/lead-portal/google-register-client";
import type { GoogleRegisterFlowResult } from "@/lib/lead-portal/google-register-client";
import { publicMockTestFormRules } from "@/lib/public-mock-test/validation";
import type { MockTestGoogleFastStep } from "./useMockTestGoogleFastFlow";

type Props = {
  step: Extract<MockTestGoogleFastStep, { kind: "register" }>;
  onCancel: () => void;
  onDecision: (result: GoogleRegisterFlowResult) => Promise<void>;
};

type FormValues = {
  displayName: string;
  phone?: string;
  consentMarketing: true;
};

export function MockTestGoogleFastRegistrationForm({
  step,
  onCancel,
  onDecision,
}: Props) {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const result = await googleFinalizeMockTestFast({
        ticket: step.ticket,
        displayName: values.displayName.trim(),
        ...(values.phone?.trim() ? { phone: values.phone.trim() } : {}),
        consentMarketing: values.consentMarketing,
      });
      await onDecision(result);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Không hoàn tất được đăng ký nhanh Google.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<FormValues>
      className="mt-4"
      layout="vertical"
      initialValues={{
        displayName: step.displayName,
        consentMarketing: false,
      }}
      onFinish={submit}
    >
      <Form.Item label="Email Google">
        <Input value={step.email} disabled />
      </Form.Item>
      <Form.Item
        label="Họ và tên"
        name="displayName"
        rules={[
          { required: true, whitespace: true, message: "Vui lòng nhập họ tên" },
        ]}
      >
        <Input maxLength={255} autoComplete="name" />
      </Form.Item>
      <Form.Item
        label="Số điện thoại (không bắt buộc)"
        name="phone"
        rules={publicMockTestFormRules.optionalPhone}
        extra="Bổ sung ngay để hoàn tất hồ sơ; hoặc để trống và cập nhật trước khi xem kết quả."
      >
        <PhoneInputField placeholder="0901234567" />
      </Form.Item>
      <Form.Item
        name="consentMarketing"
        valuePropName="checked"
        rules={[
          {
            validator: (_, checked) =>
              checked
                ? Promise.resolve()
                : Promise.reject(
                    new Error("Bạn cần đồng ý để tiếp tục đăng ký."),
                  ),
          },
        ]}
      >
        <Checkbox>
          Tôi đồng ý để Ebest liên hệ hỗ trợ thi thử và tư vấn phù hợp.
        </Checkbox>
      </Form.Item>
      <div className="flex gap-2">
        <Button onClick={onCancel} disabled={submitting}>
          Chọn lại Google
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          className="flex-1"
        >
          Tiếp tục chọn đề
        </Button>
      </div>
    </Form>
  );
}
