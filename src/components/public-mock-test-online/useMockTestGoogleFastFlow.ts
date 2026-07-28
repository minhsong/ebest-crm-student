"use client";

import { useCallback, useState } from "react";
import { App } from "antd";

import { PORTAL_MOCK_TEST_ROUTES } from "@/features/portal-mock-test/routes.config";
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

  const continueToSelectExam = useCallback(async () => {
    // Cùng Route Handler với /mock-test/online/start — tránh Server Action opaque.
    try {
      const res = await fetch("/api/mock-test/bootstrap-online", {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      } | null;
      if (data?.ok && data.redirectTo) {
        window.location.assign(data.redirectTo);
        return;
      }
      if (data?.error) {
        message.error(data.error);
      }
      window.location.assign(PORTAL_MOCK_TEST_ROUTES.hub);
    } catch {
      message.error("Không thể khởi tạo phiên thi. Vui lòng thử lại.");
      window.location.assign(PORTAL_MOCK_TEST_ROUTES.hub);
    }
  }, [message]);

  const handleDecision = useCallback(
    async (result: GoogleRegisterFlowResult) => {
      if (result.flow === "session") {
        message.success(
          result.account?.profileCompleted
            ? "Đăng nhập Google thành công."
            : "Đăng nhập Google thành công. Tiếp tục chọn bài thi.",
        );
        await continueToSelectExam();
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
    [continueToSelectExam, message],
  );

  return { step, reset, handleDecision };
}
