"use client";

import { useState } from "react";
import { App } from "antd";

import { GooglePasswordLinkForm } from "./GooglePasswordLinkForm";
import {
  googleFinalize,
  type GoogleRegisterFlowResult,
} from "@/lib/lead-portal/google-register-client";

type Props = {
  ticket: string;
  description: string;
  variant?: "default" | "on-brand";
  onCancel: () => void;
  onDecision: (result: GoogleRegisterFlowResult) => Promise<void>;
  fallbackError?: string;
  onError?: (message: string) => void;
};

/**
 * Mutation boundary dùng chung cho bước xác nhận mật khẩu liên kết Google.
 * Loading/error nằm tại step, không làm render lại container auth phía trên.
 */
export function GooglePasswordLinkStep({
  ticket,
  description,
  variant = "default",
  onCancel,
  onDecision,
  fallbackError = "Không liên kết được Google.",
  onError,
}: Props) {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (password: string) => {
    setSubmitting(true);
    try {
      await onDecision(await googleFinalize({ ticket, password }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : fallbackError;
      onError?.(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GooglePasswordLinkForm
      description={description}
      loading={submitting}
      variant={variant}
      onCancel={onCancel}
      onSubmit={submit}
    />
  );
}
