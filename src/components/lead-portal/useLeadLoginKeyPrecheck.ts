"use client";

import { useCallback, useRef, useState } from "react";
import type { FormInstance } from "antd";

import { checkLoginKeyAvailability } from "@/lib/complete-profile/check-login-key";
import { saveLeadRegisterDraft } from "@/lib/lead-portal/register-wizard";
import type {
  LeadCreateAccountEntryMode,
  LeadCreateAccountFormValues,
} from "./lead-create-account.types";

const LOGIN_KEY_CONFLICT_MSG =
  "Email hoặc số điện thoại đã được dùng trên hệ thống. Vui lòng đăng nhập hoặc dùng thông tin khác.";

type Input = {
  form: FormInstance<LeadCreateAccountFormValues>;
  entryMode: LeadCreateAccountEntryMode;
  isSelfServe: boolean;
  step1Fields: ReadonlyArray<keyof LeadCreateAccountFormValues>;
};

/**
 * Precheck chỉ hỗ trợ UX; submit API vẫn là SSOT chống trùng.
 * Sequence guard loại bỏ response cũ khi người dùng blur/chuyển bước liên tiếp.
 */
export function useLeadLoginKeyPrecheck({
  form,
  entryMode,
  isSelfServe,
  step1Fields,
}: Input) {
  const [warning, setWarning] = useState<string | null>(null);
  const [warningAction, setWarningAction] = useState<
    "login" | "contact_support" | null
  >(null);
  const requestSequence = useRef(0);
  const advancing = useRef(false);

  const clearWarning = useCallback(() => {
    setWarning(null);
    setWarningAction(null);
  }, []);

  const checkField = useCallback(
    async (field: "email" | "phone") => {
      if (
        advancing.current ||
        (entryMode === "google_complete" && field === "email")
      ) {
        return;
      }
      const requestId = ++requestSequence.current;
      const value = String(form.getFieldValue(field) ?? "").trim();
      if (!value) {
        clearWarning();
        return;
      }
      try {
        const result = await checkLoginKeyAvailability({
          ...(field === "email" ? { email: value } : { phone: value }),
        });
        if (requestId !== requestSequence.current) return;
        if (!result.available) {
          setWarning(LOGIN_KEY_CONFLICT_MSG);
          setWarningAction(result.action ?? "login");
          return;
        }
        clearWarning();
      } catch {
        if (requestId === requestSequence.current) clearWarning();
      }
    },
    [clearWarning, entryMode, form],
  );

  const validateContact = useCallback(async () => {
    if (advancing.current) return false;
    advancing.current = true;
    try {
      await form.validateFields([...step1Fields]);
    } catch {
      advancing.current = false;
      return false;
    }

    const values = form.getFieldsValue(true) as LeadCreateAccountFormValues;
    const email = values.email?.trim();
    const phone = values.phone?.trim();
    ++requestSequence.current;
    try {
      const result = await checkLoginKeyAvailability({ email, phone });
      if (!result.available) {
        setWarning(LOGIN_KEY_CONFLICT_MSG);
        setWarningAction(result.action ?? "login");
        return false;
      }
      clearWarning();
    } catch {
      // Cho phép tiếp tục; submit API vẫn enforce conflict.
    } finally {
      advancing.current = false;
    }

    if (isSelfServe) {
      saveLeadRegisterDraft({
        displayName: values.displayName?.trim(),
        phone,
        email,
      });
    }
    return true;
  }, [clearWarning, form, isSelfServe, step1Fields]);

  return { warning, warningAction, checkField, validateContact };
}
