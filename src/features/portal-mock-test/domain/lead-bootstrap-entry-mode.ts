export type LeadOnlineBootstrapEntryMode = 'google_fast' | 'retake_zalo';

/**
 * Google proof là nguồn quyết định channel; SĐT chỉ là dữ liệu hồ sơ.
 * Fallback `!phoneE164` giữ tương thích API cũ cho Google-only Lead.
 */
export function resolveLeadOnlineBootstrapEntryMode(input: {
  googleLinked?: boolean;
  phoneE164?: string | null;
}): LeadOnlineBootstrapEntryMode {
  if (input.googleLinked === true || !input.phoneE164?.trim()) {
    return 'google_fast';
  }
  return 'retake_zalo';
}
