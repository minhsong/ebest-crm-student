"use client";

import { useCallback, useState } from "react";
import { Typography } from "antd";

import { useFanpageContactUrl } from "@/contexts/portal-contact-links-context";
import type { MockTestOnlineAttemptStatus } from "@/lib/public-mock-test-online/types";
import type { PublicRegistrationOptions } from "@/lib/public-mock-test/types";
import { MockTestGoogleFastRegister } from "./MockTestGoogleFastRegister";
import { MockTestOnlineFunnelShell } from "./MockTestOnlineFunnelShell";
import { MockTestOnlineInExamResumeAlert } from "./MockTestOnlineInExamResumeAlert";
import { MockTestOnlinePhoneIntakeForm } from "./MockTestOnlinePhoneIntakeForm";
import type { MockTestOnlineInitialContact } from "./useMockTestOnlineIntakeForm";

const { Title, Paragraph } = Typography;

export type MockTestOnlineRegisterFormProps = {
  profileOptions: PublicRegistrationOptions | null;
  profileOptionsError?: string | null;
  initialContact?: MockTestOnlineInitialContact | null;
  widgetTitle?: string;
  widgetIntro?: string;
  attemptStatus?: MockTestOnlineAttemptStatus | null;
  /** Đang có bài làm dở — ẩn form đăng ký mới. */
  intakeBlocked?: boolean;
};

export function MockTestOnlineRegisterForm({
  profileOptions,
  profileOptionsError = null,
  initialContact = null,
  widgetTitle = "Đăng ký",
  widgetIntro = "Tiếp tục nhanh bằng Google hoặc điền thông tin liên hệ để đăng ký bằng số điện thoại.",
  attemptStatus = null,
  intakeBlocked = false,
}: MockTestOnlineRegisterFormProps) {
  const fanpageUrl = useFanpageContactUrl();
  const [googleFlowActive, setGoogleFlowActive] = useState(false);
  const handleGoogleFlowActiveChange = useCallback((active: boolean) => {
    setGoogleFlowActive(active);
  }, []);

  return (
    <MockTestOnlineFunnelShell step="register">
      <Title level={3} className="mock-test-page-title !mb-1 !mt-0">
        {widgetTitle}
      </Title>
      <Paragraph className="mock-test-intro-text !mb-4">
        {googleFlowActive
          ? "Email Google đã xác minh danh tính. Bổ sung số điện thoại nếu muốn, rồi chọn đề và xác nhận qua Zalo OA Ebest."
          : widgetIntro}
      </Paragraph>

      <MockTestOnlineInExamResumeAlert attemptStatus={attemptStatus} />

      {intakeBlocked ? (
        <Paragraph type="secondary" className="!mb-0">
          Hoàn thành bài thi đang làm dở trước khi đăng ký lượt thi mới.
        </Paragraph>
      ) : (
        <>
          <MockTestGoogleFastRegister
            onFlowActiveChange={handleGoogleFlowActiveChange}
          />
          {!googleFlowActive ? (
            <MockTestOnlinePhoneIntakeForm
              profileOptions={profileOptions}
              profileOptionsError={profileOptionsError}
              initialContact={initialContact}
              fanpageUrl={fanpageUrl}
            />
          ) : null}
        </>
      )}
    </MockTestOnlineFunnelShell>
  );
}
