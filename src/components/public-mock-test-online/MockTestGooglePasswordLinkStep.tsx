"use client";

import { GooglePasswordLinkStep } from "@/features/auth/GooglePasswordLinkStep";
import type { GoogleRegisterFlowResult } from "@/lib/lead-portal/google-register-client";
import type { MockTestGoogleFastStep } from "./useMockTestGoogleFastFlow";

type Props = {
  step: Extract<MockTestGoogleFastStep, { kind: "password_link" }>;
  onCancel: () => void;
  onDecision: (result: GoogleRegisterFlowResult) => Promise<void>;
};

export function MockTestGooglePasswordLinkStep({
  step,
  onCancel,
  onDecision,
}: Props) {
  return (
    <div className="mt-4">
      <GooglePasswordLinkStep
        ticket={step.ticket}
        description={step.message}
        onCancel={onCancel}
        onDecision={onDecision}
      />
    </div>
  );
}
