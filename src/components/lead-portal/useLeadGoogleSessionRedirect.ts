"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { usePortalSession } from "@/contexts/portal-session-context";
import { fetchLeadProfile } from "@/lib/lead-portal/client-api";
import { postLoginPathForPortalActor } from "@/lib/portal-auth/portal-session-nav";
import { sanitizePortalReturnUrl } from "@/lib/portal-auth/post-auth-return-url";
import { resolvePostLeadLoginPath } from "@/lib/portal-auth/session-routes";

export function useLeadGoogleSessionRedirect() {
  const router = useRouter();
  const { refresh } = usePortalSession();

  return useCallback(
    async (
      actor: "lead" | "customer",
      options?: { returnUrl?: string | null },
    ) => {
      await refresh();
      const safeReturnUrl = sanitizePortalReturnUrl(options?.returnUrl);
      if (actor === "customer") {
        router.replace(
          postLoginPathForPortalActor("customer", safeReturnUrl),
        );
        return;
      }
      const fallback = postLoginPathForPortalActor("lead", safeReturnUrl);
      // Có returnUrl an toàn → đi thẳng; route đích tự guard capability.
      if (safeReturnUrl) {
        router.replace(fallback);
        return;
      }
      try {
        router.replace(resolvePostLeadLoginPath(await fetchLeadProfile(), fallback));
      } catch {
        router.replace(fallback);
      }
    },
    [refresh, router],
  );
}
