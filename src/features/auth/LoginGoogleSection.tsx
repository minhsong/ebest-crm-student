"use client";

import { useCallback, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { App } from "antd";

import { usePortalSession } from "@/contexts/portal-session-context";
import { googleRegisterOrLogin } from "@/lib/lead-portal/google-register-client";
import { storePendingGoogleRegistration } from "@/lib/lead-portal/google-register-pending.client";
import { GooglePasswordLinkStep } from "@/features/auth/GooglePasswordLinkStep";
import { GOOGLE_COMPLETE_PROFILE_COPY } from "@/features/auth/google-auth-ui-copy";
import {
  PORTAL_RETURN_URL_QUERY,
  sanitizePortalReturnUrl,
} from "@/lib/portal-auth/post-auth-return-url";

type Props = {
  /** `customer` = HV Google login; `lead` = Google register-or-login (CRM quyết định actor). */
  mode?: "customer" | "lead";
  /** Phải nằm trong `<GoogleOAuthProvider clientId={...}>` (xem trang login). */
  onLoggedIn: (actor: "lead" | "customer") => void;
  /** Giữ qua register_ticket → /register?google=continue. */
  returnUrl?: string | null;
  /** Bọc ngoài (spacing, canh lề). */
  className?: string;
  /** Class cho dòng ghi chú dưới nút Google. */
  noteClassName?: string;
};

/**
 * Nút Google Identity Services → ID token → HV login hoặc Lead register-or-login.
 */
export function LoginGoogleSection({
  mode = "customer",
  onLoggedIn,
  returnUrl = null,
  className = "",
  noteClassName = "",
}: Props) {
  const { message: antMessage, modal } = App.useApp();
  const { refresh: refreshPortalSession } = usePortalSession();
  const safeReturnUrl = sanitizePortalReturnUrl(returnUrl);
  const [passwordLink, setPasswordLink] = useState<{
    ticket: string;
    actor: "lead" | "customer";
    message: string;
  } | null>(null);

  const note =
    mode === "lead"
      ? "Tiếp tục với Google để đăng nhập hoặc đăng ký tài khoản thí sinh. Email trùng học viên sẽ được hướng dẫn liên kết an toàn."
      : "Dùng Gmail trùng email hồ sơ tại trung tâm hoặc tài khoản đã đăng ký cổng học viên.";

  const finishSession = useCallback(
    async (actor: "lead" | "customer") => {
      await refreshPortalSession();
      antMessage.success("Đăng nhập thành công.");
      onLoggedIn(actor);
    },
    [antMessage, onLoggedIn, refreshPortalSession],
  );

  const handlePasswordDecision = useCallback(
    async (result: Awaited<ReturnType<typeof googleRegisterOrLogin>>) => {
      if (result.flow !== "session") {
        throw new Error("Không liên kết được Google. Vui lòng thử lại.");
      }
      setPasswordLink(null);
      await finishSession(result.actor);
    },
    [finishSession],
  );

  const handleGoogleResult = async (
    result: Awaited<ReturnType<typeof googleRegisterOrLogin>>,
  ) => {
    if (result.flow === "session") {
      await finishSession(result.actor);
      return;
    }
    if (result.flow === "register_ticket") {
      antMessage.info(
        "Email Google chưa có tài khoản. Chuyển sang trang đăng ký để hoàn thiện thông tin.",
      );
      storePendingGoogleRegistration({
        ticket: result.ticket,
        email: result.prefill.email,
        ...(result.prefill.displayName
          ? { displayName: result.prefill.displayName }
          : {}),
        ...(safeReturnUrl ? { returnUrl: safeReturnUrl } : {}),
      });
      const qs = new URLSearchParams({ google: "continue" });
      if (safeReturnUrl) {
        qs.set(PORTAL_RETURN_URL_QUERY, safeReturnUrl);
      }
      window.setTimeout(() => {
        window.location.assign(`/register?${qs.toString()}`);
      }, 600);
      return;
    }
    if (result.flow === "password_link") {
      setPasswordLink({
        ticket: result.ticket,
        actor: result.actor,
        message: result.message,
      });
      return;
    }
    if (result.flow === "complete_profile") {
      const copy = GOOGLE_COMPLETE_PROFILE_COPY[result.reason];
      modal.confirm({
        title: copy.title,
        content: copy.content,
        okText: "Đồng ý",
        cancelText: "Hủy",
        onOk: () => {
          window.location.assign(result.completeProfileUrl);
        },
      });
      return;
    }
    if (result.flow === "conflict") {
      antMessage.error(result.message);
    }
  };

  return (
    <div
      className={`flex w-full max-w-sm flex-col items-stretch ${className}`.trim()}
    >
      {passwordLink ? (
        <GooglePasswordLinkStep
          ticket={passwordLink.ticket}
          description={passwordLink.message}
          variant="on-brand"
          onCancel={() => setPasswordLink(null)}
          onDecision={handlePasswordDecision}
          fallbackError="Mật khẩu không đúng hoặc phiên đã hết hạn."
        />
      ) : (
        <div className="flex w-full justify-center [&_iframe]:!max-w-full">
          <GoogleLogin
            type="standard"
            onSuccess={async (cred) => {
              const t = cred.credential;
              if (!t) {
                antMessage.error("Đăng nhập Google thất bại.");
                return;
              }
              try {
                const result = await googleRegisterOrLogin(t);
                await handleGoogleResult(result);
              } catch (e) {
                antMessage.error(
                  e instanceof Error ? e.message : "Đăng nhập Google thất bại.",
                );
              }
            }}
            onError={() => {
              antMessage.error("Đăng nhập Google thất bại.");
            }}
            useOneTap={false}
            text="signin_with"
            shape="rectangular"
            size="large"
            theme="filled_blue"
            width={384}
          />
        </div>
      )}
      <p
        className={`mt-1.5 text-center text-xs text-gray-500 ${noteClassName}`.trim()}
      >
        {note}
      </p>
    </div>
  );
}
