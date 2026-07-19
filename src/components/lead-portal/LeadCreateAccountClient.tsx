"use client";

import type { LeadRegisterWizardStep } from "@/lib/lead-portal/register-wizard";
import { LeadCreateAccountDoneView } from "./LeadCreateAccountDoneView";
import { LeadCreateAccountEntryChoice } from "./LeadCreateAccountEntryChoice";
import { LeadCreateAccountUnavailableView } from "./LeadCreateAccountUnavailableView";
import { LeadCreateAccountWizardView } from "./LeadCreateAccountWizardView";
import { LeadGooglePasswordLinkView } from "./LeadGooglePasswordLinkView";
import type { LeadCreateAccountMode } from "./lead-create-account.types";
import { useLeadCreateAccountController } from "./useLeadCreateAccountController";

type Props = {
  /**
   * `self-serve` — `/register`: tạo tài khoản không cần mã đăng ký thi.
   * `proof` — `/lead/create-account`: bắt buộc `registrationId` (sau đăng ký thi).
   */
  mode?: LeadCreateAccountMode;
};

/**
 * Container chọn đúng view; state và mutation nằm trong controller,
 * từng view chỉ nhận dữ liệu/callback cần thiết.
 */
export function LeadCreateAccountClient({ mode = "proof" }: Props) {
  const controller = useLeadCreateAccountController(mode);
  const title = controller.isSelfServe
    ? "Đăng ký tài khoản"
    : "Tạo tài khoản theo dõi thi thử";
  const description = controller.isSelfServe
    ? "Tạo tài khoản cổng Ebest để thi thử online và theo dõi kết quả."
    : `Mã đăng ký #${controller.registrationId}. Dùng cùng SĐT đã đăng ký buổi thi.`;

  if (!controller.canSubmit) {
    return <LeadCreateAccountUnavailableView />;
  }

  if (controller.step === "done" && controller.doneState) {
    return <LeadCreateAccountDoneView initialState={controller.doneState} />;
  }

  if (controller.entryMode === "choose" && controller.isSelfServe) {
    return (
      <LeadCreateAccountEntryChoice
        title={title}
        description={description}
        googleConfig={controller.googleConfig}
        error={controller.submitError}
        errorAction={controller.submitErrorAction}
        onGoogleDecision={controller.handleGoogleDecision}
        onError={controller.reportSubmitError}
        onChooseEmail={controller.chooseEmail}
      />
    );
  }

  if (
    controller.entryMode === "google_password_link" &&
    controller.passwordLink
  ) {
    return (
      <LeadGooglePasswordLinkView
        ticket={controller.passwordLink.ticket}
        description={controller.passwordLink.message}
        error={controller.submitError}
        onCancel={controller.cancelPasswordLink}
        onDecision={controller.handlePasswordLinkDecision}
        onError={controller.reportSubmitError}
      />
    );
  }

  return (
    <LeadCreateAccountWizardView
      form={controller.form}
      title={title}
      description={description}
      step={controller.step as LeadRegisterWizardStep}
      isSelfServe={controller.isSelfServe}
      isGoogleComplete={controller.entryMode === "google_complete"}
      loading={controller.loading}
      loginKeyWarning={controller.loginKeyWarning}
      loginKeyWarningAction={controller.loginKeyWarningAction}
      submitError={controller.submitError}
      submitErrorAction={controller.submitErrorAction}
      onFinish={controller.onFormFinish}
      onPrecheck={(field) => void controller.runLoginKeyPrecheck(field)}
      onBack={controller.backToContact}
      onChooseOther={controller.chooseOther}
      onNext={() => void controller.goNextFromContact()}
    />
  );
}
