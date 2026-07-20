"use client";

import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Divider } from "antd";

import { usePortalGoogleConfig } from "@/features/auth/usePortalGoogleConfig";
import { MockTestGoogleFastRegistrationForm } from "./MockTestGoogleFastRegistrationForm";
import { MockTestGoogleLoginStep } from "./MockTestGoogleLoginStep";
import { MockTestGooglePasswordLinkStep } from "./MockTestGooglePasswordLinkStep";
import { useMockTestGoogleFastFlow } from "./useMockTestGoogleFastFlow";

type Props = {
  onFlowActiveChange?: (active: boolean) => void;
};

export function MockTestGoogleFastRegister({
  onFlowActiveChange,
}: Props) {
  const googleConfig = usePortalGoogleConfig();
  if (!googleConfig?.enabled || !googleConfig.clientId) return null;

  return (
    <GoogleOAuthProvider clientId={googleConfig.clientId} locale="vi">
      <MockTestGoogleFastRegisterContent
        onFlowActiveChange={onFlowActiveChange}
      />
    </GoogleOAuthProvider>
  );
}

function MockTestGoogleFastRegisterContent({
  onFlowActiveChange,
}: Props) {
  const { step, reset, handleDecision } = useMockTestGoogleFastFlow();
  const flowActive = step.kind !== "google";

  useEffect(() => {
    onFlowActiveChange?.(flowActive);
  }, [flowActive, onFlowActiveChange]);

  return (
    <section aria-label="Đăng ký nhanh bằng Google">
      {step.kind === "register" ? (
        <MockTestGoogleFastRegistrationForm
          step={step}
          onCancel={reset}
          onDecision={handleDecision}
        />
      ) : step.kind === "password_link" ? (
        <MockTestGooglePasswordLinkStep
          step={step}
          onCancel={reset}
          onDecision={handleDecision}
        />
      ) : (
        <MockTestGoogleLoginStep onDecision={handleDecision} />
      )}

      {!flowActive ? (
        <Divider plain>Hoặc đăng ký bằng số điện thoại</Divider>
      ) : null}
    </section>
  );
}
