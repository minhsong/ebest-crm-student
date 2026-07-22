"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Form } from "antd";

import {
  clearIntakeDraft,
  readIntakeDraft,
  writeIntakeDraft,
} from "@/lib/public-mock-test-online/mock-test-online-intake-draft";
import { extractMockTestOnlineApiError } from "@/lib/public-mock-test-online/mock-test-online-api-error";
import {
  mockTestOnlineErrorCopyFromUnknown,
  resolveMockTestOnlineApiErrorCopy,
} from "@/lib/public-mock-test-online/mock-test-online-session-errors.util";
import { executeRecaptchaMockTestOnlineIntake } from "@/lib/public-mock-test-online/recaptcha";
import type {
  MockTestOnlineLeadIntakeResponse,
  MockTestOnlineRegisterFormValues,
} from "@/lib/public-mock-test-online/types";

export type MockTestOnlineInitialContact = {
  displayName?: string;
  primaryPhone?: string;
  primaryEmail?: string;
};

export type IntakeUiError = {
  title: string;
  description: string;
  errorCode?: string;
  action?: "login" | "contact_support" | "retry" | "resume_email";
};

export function useMockTestOnlineIntakeForm(
  initialContact: MockTestOnlineInitialContact | null,
) {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<MockTestOnlineRegisterFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [intakeError, setIntakeError] = useState<IntakeUiError | null>(null);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const draft = readIntakeDraft();
    if (!draft) return;
    form.setFieldsValue({
      displayName: draft.displayName ?? initialContact?.displayName ?? "",
      primaryPhone: draft.primaryPhone ?? initialContact?.primaryPhone ?? "",
      primaryEmail: draft.primaryEmail ?? initialContact?.primaryEmail ?? "",
      consentMarketing: draft.consentMarketing ?? false,
      resultDeliveryEmail: draft.resultDeliveryEmail ?? false,
      ...draft,
    });
  }, [form, initialContact]);

  useEffect(
    () => () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    },
    [],
  );

  const scheduleDraftSave = useCallback(
    (values: Partial<MockTestOnlineRegisterFormValues>) => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = setTimeout(() => writeIntakeDraft(values), 400);
    },
    [],
  );

  const onValuesChange = useCallback(
    (
      _changedValues: Partial<MockTestOnlineRegisterFormValues>,
      allValues: MockTestOnlineRegisterFormValues,
    ) => {
      setIntakeError(null);
      scheduleDraftSave(allValues);
    },
    [scheduleDraftSave],
  );

  const onFinish = useCallback(
    async (values: MockTestOnlineRegisterFormValues) => {
      setSubmitting(true);
      setIntakeError(null);
      try {
        const recaptchaToken = await executeRecaptchaMockTestOnlineIntake();
        const response = await fetch("/api/public/mock-test-online/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: values.displayName.trim(),
            primaryPhone: values.primaryPhone?.trim(),
            // Email bắt buộc — login key portal (không sinh email nội bộ).
            primaryEmail: values.primaryEmail.trim(),
            resultDeliveryEmail: Boolean(values.resultDeliveryEmail),
            consentMarketing: values.consentMarketing,
            recaptchaToken,
          }),
        });
        const data =
          (await response.json()) as MockTestOnlineLeadIntakeResponse &
            Record<string, unknown>;

        if (!response.ok) {
          const extracted = extractMockTestOnlineApiError(data);
          const inferredCode =
            extracted.errorCode ??
            (/email.*đã được dùng|đã được dùng trên cổng/i.test(
              extracted.message,
            )
              ? "EMAIL_ALREADY_IN_SYSTEM"
              : /số điện thoại này đã gắn/i.test(extracted.message)
                ? "PHONE_ALREADY_IN_SYSTEM"
                : undefined);
          const copy = resolveMockTestOnlineApiErrorCopy({
            message: extracted.message,
            errorCode: inferredCode,
            step: "b1_register_intake",
          });
          const action =
            inferredCode === "EMAIL_ALREADY_IN_SYSTEM" ||
            inferredCode === "PORTAL_EMAIL_ALREADY_REGISTERED"
              ? "resume_email"
              : (extracted.action ??
                (copy.recovery === "login" ||
                copy.recovery === "contact_support" ||
                copy.recovery === "retry"
                  ? copy.recovery
                  : "retry"));
          const description =
            inferredCode === "RATE_LIMITED" && extracted.message.trim()
              ? extracted.message
              : inferredCode &&
                  extracted.message.trim() &&
                  extracted.message.trim() !== copy.title
                ? extracted.message
                : copy.description;
          setIntakeError({
            title: copy.title,
            description,
            errorCode: inferredCode,
            action,
          });
          return;
        }

        if (!data.pendingLeadId) {
          setIntakeError({
            title: "Không nhận được phản hồi đăng ký",
            description:
              "Vui lòng thử lại. Nếu vẫn lỗi, liên hệ Fanpage Ebest để được hỗ trợ.",
            action: "retry",
          });
          return;
        }

        message.success("Đăng ký thành công. Chọn bài thi tiếp theo nhé!");
        clearIntakeDraft();
        router.push(
          `/mock-test-online/select-exam?lead=${encodeURIComponent(data.pendingLeadId)}`,
        );
      } catch (error) {
        const copy = mockTestOnlineErrorCopyFromUnknown(
          error,
          "b1_register_intake",
          "Đăng ký thất bại",
        );
        setIntakeError({
          title: copy.title,
          description: copy.description,
          action:
            copy.recovery === "login" ||
            copy.recovery === "contact_support" ||
            copy.recovery === "retry"
              ? copy.recovery
              : "retry",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [message, router],
  );

  const retry = useCallback(() => {
    setIntakeError(null);
    form.submit();
  }, [form]);

  return {
    form,
    submitting,
    intakeError,
    onFinish,
    onValuesChange,
    retry,
  };
}
