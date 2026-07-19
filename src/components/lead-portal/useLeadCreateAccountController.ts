"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { App, Form } from "antd";

import { GOOGLE_COMPLETE_PROFILE_COPY } from "@/features/auth/google-auth-ui-copy";
import { usePortalGoogleConfig } from "@/features/auth/usePortalGoogleConfig";
import { leadRegister } from "@/lib/lead-portal/client-api";
import {
  googleFinalize,
  type GoogleRegisterFlowResult,
} from "@/lib/lead-portal/google-register-client";
import {
  clearPendingGoogleRegistration,
  readPendingGoogleRegistration,
  storePendingGoogleRegistration,
} from "@/lib/lead-portal/google-register-pending.client";
import {
  clearLeadRegisterDraft,
  LEAD_REGISTER_STEP_1_FIELDS,
  LEAD_REGISTER_STEP_1_FIELDS_PROOF,
  loadLeadRegisterDraft,
  type LeadRegisterWizardStep,
} from "@/lib/lead-portal/register-wizard";
import {
  PORTAL_RETURN_URL_QUERY,
  sanitizePortalReturnUrl,
} from "@/lib/portal-auth/post-auth-return-url";
import type {
  LeadCreateAccountDoneState,
  LeadCreateAccountEntryMode,
  LeadCreateAccountFormValues,
  LeadCreateAccountMode,
} from "./lead-create-account.types";
import { useLeadGoogleSessionRedirect } from "./useLeadGoogleSessionRedirect";
import { useLeadLoginKeyPrecheck } from "./useLeadLoginKeyPrecheck";

export function useLeadCreateAccountController(mode: LeadCreateAccountMode) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { message, modal } = App.useApp();
  const redirectAfterGoogleSession = useLeadGoogleSessionRedirect();
  const [form] = Form.useForm<LeadCreateAccountFormValues>();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LeadRegisterWizardStep | "done">(1);
  const [entryMode, setEntryMode] = useState<LeadCreateAccountEntryMode>(() =>
    mode === "self-serve" ? "choose" : "email",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorAction, setSubmitErrorAction] = useState<
    "login" | "contact_support" | null
  >(null);
  const [doneState, setDoneState] = useState<LeadCreateAccountDoneState | null>(
    null,
  );
  const googleConfig = usePortalGoogleConfig();
  const [googleTicket, setGoogleTicket] = useState<string | null>(null);
  const pendingGoogleFromNavigation = useRef<
    ReturnType<typeof readPendingGoogleRegistration> | undefined
  >(undefined);
  const [passwordLink, setPasswordLink] = useState<{
    ticket: string;
    actor: "lead" | "customer";
    message: string;
  } | null>(null);

  const registrationIdRaw = Number(searchParams.get("registrationId"));
  const registrationId =
    Number.isFinite(registrationIdRaw) && registrationIdRaw >= 1
      ? registrationIdRaw
      : null;
  const returnUrlFromQuery = sanitizePortalReturnUrl(
    searchParams.get(PORTAL_RETURN_URL_QUERY),
  );

  const resolveReturnUrl = useCallback(() => {
    return (
      returnUrlFromQuery ||
      sanitizePortalReturnUrl(readPendingGoogleRegistration()?.returnUrl) ||
      null
    );
  }, [returnUrlFromQuery]);

  const isSelfServe = mode === "self-serve";
  const canSubmit = isSelfServe || registrationId != null;

  const step1Fields = useMemo(
    () =>
      (isSelfServe
        ? LEAD_REGISTER_STEP_1_FIELDS
        : LEAD_REGISTER_STEP_1_FIELDS_PROOF) as ReadonlyArray<
        keyof LeadCreateAccountFormValues
      >,
    [isSelfServe],
  );
  const {
    warning: loginKeyWarning,
    warningAction: loginKeyWarningAction,
    checkField: runLoginKeyPrecheck,
    validateContact,
  } = useLeadLoginKeyPrecheck({
    form,
    entryMode,
    isSelfServe,
    step1Fields,
  });

  useEffect(() => {
    if (!isSelfServe || entryMode === "google_complete") return;
    if (
      searchParams.get("google") === "continue" &&
      pendingGoogleFromNavigation.current === undefined
    ) {
      pendingGoogleFromNavigation.current = readPendingGoogleRegistration();
    }
    const pendingGoogle =
      searchParams.get("google") === "continue"
        ? pendingGoogleFromNavigation.current
        : null;
    if (pendingGoogle) {
      setGoogleTicket(pendingGoogle.ticket);
      setEntryMode("google_complete");
      form.setFieldsValue({
        email: pendingGoogle.email,
        ...(pendingGoogle.displayName
          ? { displayName: pendingGoogle.displayName }
          : {}),
      });
      return;
    }
    const draft = loadLeadRegisterDraft();
    if (draft) {
      form.setFieldsValue({
        displayName: draft.displayName,
        phone: draft.phone,
        email: draft.email,
      });
    }
  }, [entryMode, form, isSelfServe, searchParams]);

  const clearGoogleRegistrationDraft = useCallback(() => {
    clearPendingGoogleRegistration();
    pendingGoogleFromNavigation.current = null;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("google");
    router.replace(next.size > 0 ? `${pathname}?${next}` : pathname);
  }, [pathname, router, searchParams]);

  const handlePasswordLinkDecision = useCallback(
    async (result: GoogleRegisterFlowResult) => {
      if (result.flow !== "session") {
        throw new Error("Không liên kết được Google.");
      }
      setPasswordLink(null);
      message.success("Đã liên kết Google.");
      await redirectAfterGoogleSession(result.actor, {
        returnUrl: resolveReturnUrl(),
      });
    },
    [message, redirectAfterGoogleSession, resolveReturnUrl],
  );

  const handleGoogleDecision = useCallback(
    async (result: GoogleRegisterFlowResult) => {
      setSubmitError(null);
      if (result.flow === "session") {
        message.success("Đăng nhập thành công.");
        await redirectAfterGoogleSession(result.actor, {
          returnUrl: resolveReturnUrl(),
        });
        return;
      }
      if (result.flow === "register_ticket") {
        const safeReturnUrl = resolveReturnUrl();
        storePendingGoogleRegistration({
          ticket: result.ticket,
          email: result.prefill.email,
          ...(result.prefill.displayName
            ? { displayName: result.prefill.displayName }
            : {}),
          ...(safeReturnUrl ? { returnUrl: safeReturnUrl } : {}),
        });
        const next = new URLSearchParams(searchParams.toString());
        next.set("google", "continue");
        if (safeReturnUrl) {
          next.set(PORTAL_RETURN_URL_QUERY, safeReturnUrl);
        }
        router.replace(`${pathname}?${next}`);
        setGoogleTicket(result.ticket);
        setEntryMode("google_complete");
        form.setFieldsValue({
          email: result.prefill.email,
          ...(result.prefill.displayName
            ? { displayName: result.prefill.displayName }
            : {}),
        });
        return;
      }
      if (result.flow === "password_link") {
        setPasswordLink({
          ticket: result.ticket,
          actor: result.actor,
          message: result.message,
        });
        setEntryMode("google_password_link");
        return;
      }
      if (result.flow === "complete_profile") {
        const copy = GOOGLE_COMPLETE_PROFILE_COPY[result.reason];
        modal.confirm({
          title: copy.title,
          content: copy.content,
          okText: "Đồng ý",
          cancelText: "Hủy",
          onOk: () => window.location.assign(result.completeProfileUrl),
        });
        return;
      }
      setSubmitError(result.message);
      setSubmitErrorAction(result.action === "login" ? "login" : null);
      message.error(result.message);
    },
    [
      form,
      message,
      modal,
      pathname,
      redirectAfterGoogleSession,
      resolveReturnUrl,
      router,
      searchParams,
    ],
  );

  const goNextFromContact = useCallback(async () => {
    setSubmitError(null);
    setSubmitErrorAction(null);
    if (await validateContact()) setStep(2);
  }, [validateContact]);

  const handleRegister = useCallback(
    async (values: LeadCreateAccountFormValues) => {
      if (!isSelfServe && registrationId == null) {
        message.error(
          "Thiếu mã đăng ký thi thử. Vui lòng mở lại từ trang đăng ký.",
        );
        return;
      }
      setLoading(true);
      setSubmitError(null);
      setSubmitErrorAction(null);
      try {
        if (entryMode === "google_complete" && googleTicket) {
          const result = await googleFinalize({
            ticket: googleTicket,
            password: values.password,
            phone: values.phone,
            displayName: values.displayName,
            ...(registrationId != null ? { registrationId } : {}),
          });
          if (result.flow !== "session") {
            throw new Error("Không hoàn tất đăng ký Google. Vui lòng thử lại.");
          }
          clearLeadRegisterDraft();
          clearGoogleRegistrationDraft();
          message.success("Đăng ký Google thành công.");
          await redirectAfterGoogleSession(result.actor, {
            returnUrl: resolveReturnUrl(),
          });
          return;
        }

        const result = await leadRegister({
          ...(registrationId != null ? { registrationId } : {}),
          phone: values.phone.trim(),
          email: values.email.trim(),
          password: values.password,
          ...(values.displayName?.trim()
            ? { displayName: values.displayName.trim() }
            : {}),
        });
        clearLeadRegisterDraft();
        setDoneState({
          email: values.email.trim(),
          emailVerificationSent: result.emailVerificationSent,
          message: result.message,
        });
        setStep("done");
        message[result.emailVerificationSent ? "success" : "warning"](
          result.message,
        );
      } catch (error) {
        const typedError = error as Error & {
          action?: "login" | "contact_support";
          code?: string;
        };
        const errorMessage = typedError.message || "Đăng ký thất bại.";
        setSubmitError(errorMessage);
        if (
          typedError.action === "login" ||
          typedError.action === "contact_support"
        ) {
          setSubmitErrorAction(typedError.action);
        } else if (
          /đã|trùng|tồn tại|conflict|already/i.test(errorMessage) ||
          typedError.code?.includes("ALREADY")
        ) {
          setSubmitErrorAction("login");
        }
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      clearGoogleRegistrationDraft,
      entryMode,
      googleTicket,
      isSelfServe,
      message,
      redirectAfterGoogleSession,
      registrationId,
      resolveReturnUrl,
    ],
  );

  const onFormFinish = useCallback(
    (values: LeadCreateAccountFormValues) => {
      if (entryMode === "google_complete" || step !== 1) {
        void handleRegister(values);
      } else {
        void goNextFromContact();
      }
    },
    [entryMode, goNextFromContact, handleRegister, step],
  );

  const chooseOther = useCallback(() => {
    setSubmitError(null);
    setGoogleTicket(null);
    clearGoogleRegistrationDraft();
    setEntryMode("choose");
    setStep(1);
  }, [clearGoogleRegistrationDraft]);

  const chooseEmail = useCallback(() => {
    setEntryMode("email");
    setStep(1);
  }, []);

  const cancelPasswordLink = useCallback(() => {
    setPasswordLink(null);
    setEntryMode("choose");
  }, []);

  const backToContact = useCallback(() => {
    setSubmitError(null);
    setStep(1);
  }, []);

  return {
    form,
    loading,
    step,
    entryMode,
    loginKeyWarning,
    loginKeyWarningAction,
    submitError,
    submitErrorAction,
    doneState,
    googleConfig,
    passwordLink,
    isSelfServe,
    canSubmit,
    registrationId,
    handleGoogleDecision,
    handlePasswordLinkDecision,
    runLoginKeyPrecheck,
    goNextFromContact,
    onFormFinish,
    reportSubmitError: setSubmitError,
    chooseEmail,
    cancelPasswordLink,
    backToContact,
    chooseOther,
  };
}
