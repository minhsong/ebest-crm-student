/** Đồng bộ cookie portal với CRM `AUTH_STUDENT_PORTAL_EXPIRES_IN` (mặc định 30d). */
export function resolvePortalAuthCookieMaxAgeSec(): number {
  const raw = process.env.AUTH_STUDENT_PORTAL_EXPIRES_IN?.trim() || '30d';
  const match = /^(\d+)([smhd])$/i.exec(raw);
  if (!match) {
    return 60 * 60 * 24 * 30;
  }
  const n = Number.parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();
  const mult =
    unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return n * mult;
}
