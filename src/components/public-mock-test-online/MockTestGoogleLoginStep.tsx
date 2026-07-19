"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { App, Spin } from "antd";

import {
  googleRegisterOrLogin,
  type GoogleRegisterFlowResult,
} from "@/lib/lead-portal/google-register-client";

type Props = {
  onDecision: (result: GoogleRegisterFlowResult) => Promise<void>;
};

export function MockTestGoogleLoginStep({ onDecision }: Props) {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  return (
    <Spin spinning={submitting}>
      <div className="mt-4 flex justify-center [&_iframe]:!max-w-full">
        <GoogleLogin
          type="standard"
          text="continue_with"
          shape="rectangular"
          size="large"
          theme="filled_blue"
          width={384}
          useOneTap={false}
          onSuccess={async (credential) => {
            if (!credential.credential) {
              message.error("Xác thực Google thất bại.");
              return;
            }
            setSubmitting(true);
            try {
              await onDecision(
                await googleRegisterOrLogin(
                  credential.credential,
                  "mock_test_fast",
                ),
              );
            } catch (error) {
              message.error(
                error instanceof Error
                  ? error.message
                  : "Xác thực Google thất bại.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
          onError={() => message.error("Xác thực Google thất bại.")}
        />
      </div>
    </Spin>
  );
}
