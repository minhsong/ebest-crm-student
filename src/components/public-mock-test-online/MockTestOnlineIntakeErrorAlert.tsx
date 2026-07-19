import Link from "next/link";
import { Alert, Button, Space } from "antd";

import { ContactSupportRichText } from "@/components/portal-contact/ContactSupportRichText";
import type { IntakeUiError } from "./useMockTestOnlineIntakeForm";

type Props = {
  error: IntakeUiError;
  loginHref: string;
  fanpageUrl: string;
  onRetry: () => void;
};

export function MockTestOnlineIntakeErrorAlert({
  error,
  loginHref,
  fanpageUrl,
  onRetry,
}: Props) {
  const canContact =
    error.action === "contact_support" ||
    error.action === "login" ||
    error.action === "retry";

  return (
    <Alert
      className="!mb-4"
      type="warning"
      showIcon
      message={<ContactSupportRichText text={error.title} />}
      description={<ContactSupportRichText text={error.description} />}
      action={
        <Space direction="vertical" size="small">
          {error.action === "login" ? (
            <Link href={loginHref}>
              <Button type="primary" size="small">
                Đăng nhập cổng học viên
              </Button>
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
