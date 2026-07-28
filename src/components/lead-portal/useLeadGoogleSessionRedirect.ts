"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { usePortalSession } from "@/contexts/portal-session-context";
import { postLoginPathForPortalActor } from "@/lib/portal-auth/portal-session-nav";
import { sanitizePortalReturnUrl } from "@/lib/portal-auth/post-auth-return-url";
import { resolveLeadRedirectFromSession } from "@/lib/portal-auth/resolve-lead-navigation";

/** Sau Google session — cùng SSOT post-login với form password. */
export function useLeadGoogleSessionRedirect() {
  const router = useRouter();
  const { refresh } = usePortalSession();

  return useCallback(
    async (
      actor: "lead" | "customer",
      options?: { returnUrl?: string | null },
    ) => {
      const session = await refresh();
      const safeReturnUrl = sanitizePortalReturnUrl(options?.returnUrl);
      if (actor === "customer") {
        router.replace(
          postLoginPathForPortalActor("customer", safeReturnUrl),
        );
        return;
      }
      router.replace(resolveLeadRedirectFromSession(session, safeReturnUrl));
    },
    [refresh, router],
  );
}
