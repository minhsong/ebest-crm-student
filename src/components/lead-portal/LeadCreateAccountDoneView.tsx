"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, App, Button, Space } from "antd";

import { LeadPortalShell } from "./LeadPortalShell";
import { leadResendEmailVerification } from "@/lib/lead-portal/client-api";
import type { LeadCreateAccountDoneState } from "./lead-create-account.types";

type Props = {
  initialState: LeadCreateAccountDoneState;
};

export function LeadCreateAccountDoneView({ initialState }: Props) {
  const { message } = App.useApp();
  const [state, setState] = useState(initialState);
  const [resending, setResending] = useState(false);
  const sent = state.emailVerificationSent;

  const resend = async () => {
    setResending(true);
    try {
      const result = await leadResendEmailVerification(state.email);
      if (result.sent) {
        setState((current) => ({
          ...current,
          emailVerificationSent: true,
          message: result.message,
        }));
        message.success(result.message);
      } else {
        message.warning(result.message);
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Không gửi lại được email.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <LeadPortalShell
      title={sent ? "Kiểm tra email xác nhận" : "Đã tạo tài khoản"}
      description={
        sent
          ? "Tài khoản đã tạo. Xác nhận email trước khi đăng nhập và hoàn thiện hồ sơ."
          : "Tài khoản đã tạo nhưng hệ thống chưa gửi được email xác nhận."
      }
    >
      <Alert
        type={sent ? "success" : "warning"}
        showIcon
        className="mb-4"
        message={
          sent
            ? "Đăng ký thành công — cần xác nhận email"
            : "Đăng ký thành công — chưa gửi được email"
        }
        description={
          state.message ??
          (sent
            ? "Mở hộp thư (và mục spam), bấm liên kết xác nhận, rồi đăng nhập."
            : "Bạn có thể thử gửi lại email bên dưới. Nếu vẫn lỗi, liên hệ Ebest.")
        }
      />
      <Space direction="vertical" className="w-full" size="middle">
        <Button block loading={resending} onClick={resend}>
          Gửi lại email xác nhận
        </Button>
        <Link href="/login?mode=lead">
          <Button type="primary" block disabled={!sent}>
            {sent
              ? "Đã xác nhận — đăng nhập"
              : "Đăng nhập (sau khi có email xác nhận)"}
          </Button>
        </Link>
      </Space>
    </LeadPortalShell>
  );
}
