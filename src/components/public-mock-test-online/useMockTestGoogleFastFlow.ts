"use client";

import { useCallback, useState } from "react";
import { App } from "antd";

import type { GoogleRegisterFlowResult } from "@/lib/lead-portal/google-register-client";

export type MockTestGoogleFastStep =
  | { kind: "google" }
  | {
      kind: "register";
      ticket: string;
      email: string;
      displayName: string;
    }
  | {
      kind: "password_link";
      ticket: string;
      actor: "lead" | "customer";
      message: string;
    };

/**
 * Điều phối state machine UI của Google fast path.
 * Mỗi form con tự quản lý loading để mutation chỉ render lại đúng step đang mở.
 */
export function useMockTestGoogleFastFlow() {
  const { message } = App.useApp();
  const [step, setStep] = useState<MockTestGoogleFastStep>({ kind: "google" });

  const reset = useCallback(() => setStep({ kind: "google" }), []);

  const handleDecision = useCallback(
    async (result: GoogleRegisterFlowResult) => {
      if (result.flow === "session") {
        message.success("Đăng ký nhanh thành công.");
        // BFF đã set httpOnly cookie; chuyển trang trực tiếp, không refresh global
        // PortalSession gây render lại toàn cây trước khi navigation.
        window.location.assign("/mock-test/online/start");
        return;
      }

      if (result.flow === "register_ticket") {
        setStep({
          kind: "register",
          ticket: result.ticket,
          email: result.prefill.email,
          displayName: result.prefill.displayName ?? "",
        });
        return;
      }

      if (result.flow === "password_link") {
        setStep({
          kind: "password_link",
          ticket: result.ticket,
          actor: result.actor,
          message: result.message,
        });
        return;
      }

      if (result.flow === "complete_profile") {
        message.info("Hồ sơ học viên cần được hoàn thiện trước khi tiếp tục.");
        window.location.assign(result.completeProfileUrl);
        return;
      }

      message.error(result.message);
    },
    [message],
  );

  return { step, reset, handleDecision };
}
