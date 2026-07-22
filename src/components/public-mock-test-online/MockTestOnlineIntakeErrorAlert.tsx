import Link from "next/link";
import { useState } from "react";
import { Alert, App, Button, Space } from "antd";

import { ContactSupportRichText } from "@/components/portal-contact/ContactSupportRichText";
import type { IntakeUiError } from "./useMockTestOnlineIntakeForm";

type Props = {
  error: IntakeUiError;
  loginHref: string;
  fanpageUrl: string;
  /** Email trên form — gửi magic link resume. */
  resumeEmail?: string;
  onRetry: () => void;
};

export function MockTestOnlineIntakeErrorAlert({
  error,
  loginHref,
  fanpageUrl,
  resumeEmail,
  onRetry,
}: Props) {
  const { message } = App.useApp();
  const [sendingResume, setSendingResume] = useState(false);
  const showResumeEmail =
    error.action === "resume_email" ||
    error.errorCode === "EMAIL_ALREADY_IN_SYSTEM" ||
    error.errorCode === "PORTAL_EMAIL_ALREADY_REGISTERED";

  const canContact =
    error.action === "contact_support" ||
    error.action === "login" ||
    error.action === "retry" ||
    error.action === "resume_email";

  const onSendResumeLink = async () => {
    const email = resumeEmail?.trim();
    if (!email) {
      message.warning("Nhập email trên form rồi thử lại.");
      return;
    }
    setSendingResume(true);
    try {
      const res = await fetch("/api/auth/lead/mto-resume/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        message.error(
          typeof data.message === "string" && data.message.trim()
            ? data.message
            : "Không thể gửi liên kết. Vui lòng thử lại.",
        );
        return;
      }
      message.success(
        typeof data.message === "string" && data.message.trim()
          ? data.message
          : "Nếu email đã đăng ký, hệ thống đã gửi liên kết tiếp tục.",
      );
    } catch {
      message.error("Không thể gửi liên kết. Vui lòng thử lại.");
    } finally {
      setSendingResume(false);
    }
  };

  return (
    <Alert
      className="!mb-4"
      type="warning"
      showIcon
      message={<ContactSupportRichText text={error.title} />}
      description={<ContactSupportRichText text={error.description} />}
      action={
        <Space direction="vertical" size="small">
          {showResumeEmail ? (
            <Button
              type="primary"
              size="small"
              loading={sendingResume}
              onClick={onSendResumeLink}
            >
              Gửi link tiếp tục qua email
            </Button>
          ) : null}
          {error.action === "login" || showResumeEmail ? (
            <Link href={loginHref}>
              <Button size="small">Đăng nhập cổng học viên</Button>
            </Link>
          ) : null}
          {showResumeEmail ? (
            <Link href="/mock-test-online/register">
              <Button size="small">Đăng ký / tiếp tục bằng Google</Button>
            </Link>
          ) : null}
          {canContact ? (
            <Button
              size="small"
              href={fanpageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Nhắn tin Fanpage Ebest
            </Button>
          ) : null}
          {error.action === "retry" ? (
            <Button size="small" onClick={onRetry}>
              Thử lại
            </Button>
          ) : null}
        </Space>
      }
    />
  );
}
