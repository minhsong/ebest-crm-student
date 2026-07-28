"use client";

import { useState } from "react";
import Link from "next/link";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, App, Button, Space, Spin } from "antd";

import type { PortalGoogleConfig } from "@/features/auth/usePortalGoogleConfig";
import {
  googleRegisterOrLogin,
  type GoogleRegisterFlowResult,
} from "@/lib/lead-portal/google-register-client";
import { LeadPortalShell } from "./LeadPortalShell";

type Props = {
  title: string;
  description: string;
  googleConfig: PortalGoogleConfig | null;
  error: string | null;
  errorAction: "login" | "contact_support" | null;
  onGoogleDecision: (result: GoogleRegisterFlowResult) => Promise<void>;
  onError: (message: string) => void;
  onChooseEmail: () => void;
};

export function LeadCreateAccountEntryChoice({
  title,
  description,
  googleConfig,
  error,
  errorAction,
  onGoogleDecision,
  onError,
  onChooseEmail,
}: Props) {
  const { message } = App.useApp();
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const authenticateGoogle = async (idToken: string) => {
    setGoogleSubmitting(true);
    try {
      await onGoogleDecision(await googleRegisterOrLogin(idToken));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "ÄÄƒng kÃ½ Google tháº¥t báº¡i.";
      onError(errorMessage);
      message.error(errorMessage);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <LeadPortalShell
      title={title}
      description={description}
      maxWidthClass="max-w-lg"
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message={error}
          action={
            errorAction === "login" ? (
              <Link href="/login">
                <Button size="small" type="primary">
                  ÄÄƒng nháº­p
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : null}

      <Space direction="vertical" className="w-full" size="middle">
        {googleConfig?.enabled && googleConfig.clientId ? (
          <GoogleOAuthProvider clientId={googleConfig.clientId} locale="vi">
            <Spin spinning={googleSubmitting}>
              <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-4">
                <p className="mb-3 text-sm font-medium text-gray-800">
                  <GoogleOutlined className="mr-2 text-orange-600" />
                  Tiáº¿p tá»¥c vá»›i Google
                </p>
                <div className="flex justify-center [&_iframe]:!max-w-full">
                  <GoogleLogin
                    type="standard"
                    text="continue_with"
                    shape="rectangular"
                    size="large"
                    theme="filled_blue"
                    width={384}
                    useOneTap={false}
                    onSuccess={(credential) => {
                      if (!credential.credential) {
                        message.error("KhÃ´ng láº¥y Ä‘Æ°á»£c mÃ£ Google.");
                        return;
                      }
                      void authenticateGoogle(credential.credential);
                    }}
                    onError={() => message.error("ÄÄƒng kÃ½ Google tháº¥t báº¡i.")}
                  />
                </div>
                <p className="mb-0 mt-2 text-center text-xs text-gray-500">
                  Email má»›i sáº½ hoÃ n thiá»‡n thÃ´ng tin vÃ  táº¡o máº­t kháº©u trÆ°á»›c khi má»Ÿ
                  tÃ i khoáº£n.
                </p>
              </div>
            </Spin>
          </GoogleOAuthProvider>
        ) : null}

        <Button
          type="default"
          size="large"
          block
          icon={<MailOutlined />}
          disabled={googleSubmitting}
          onClick={onChooseEmail}
        >
          ÄÄƒng kÃ½ báº±ng email
        </Button>
      </Space>

      <p className="mt-6 text-center text-sm text-gray-500">
        ÄÃ£ cÃ³ tÃ i khoáº£n?{" "}
        <Link
          href="/login"
          className="font-medium text-orange-600 hover:underline"
        >
          ÄÄƒng nháº­p
        </Link>
      </p>
    </LeadPortalShell>
  );
}
