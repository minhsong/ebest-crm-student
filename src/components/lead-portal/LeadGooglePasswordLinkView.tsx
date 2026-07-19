import { Alert } from "antd";

import { GooglePasswordLinkStep } from "@/features/auth/GooglePasswordLinkStep";
import type { GoogleRegisterFlowResult } from "@/lib/lead-portal/google-register-client";
import { LeadPortalShell } from "./LeadPortalShell";

type Props = {
  ticket: string;
  description: string;
  error: string | null;
  onCancel: () => void;
  onDecision: (result: GoogleRegisterFlowResult) => Promise<void>;
  onError: (message: string) => void;
};

export function LeadGooglePasswordLinkView({
  ticket,
  description,
  error,
  onCancel,
  onDecision,
  onError,
}: Props) {
  return (
    <LeadPortalShell
      title="Liên kết tài khoản Google"
      description={description}
      maxWidthClass="max-w-lg"
    >
      {error ? (
        <Alert type="error" showIcon className="mb-4" message={error} />
      ) : null}
      <GooglePasswordLinkStep
        ticket={ticket}
        description={description}
        onCancel={onCancel}
        onDecision={onDecision}
        fallbackError="Liên kết Google thất bại."
        onError={onError}
      />
    </LeadPortalShell>
  );
}
