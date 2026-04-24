/**
 * Chuẩn hoá object `customer` từ CRM `GET /api/v1/student/me` (đã cache Redis phía CRM).
 */
export interface StudentMeCustomerBrief {
  id: number;
  fullName: string;
  primaryEmail?: string;
  primaryPhone?: string;
  avatarUrl?: string | null;
}

export function parseStudentMeCustomerBrief(
  raw: unknown
): StudentMeCustomerBrief | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const id = Number(c.id);
  if (!Number.isFinite(id)) return null;

  const part = [c.firstName, c.lastName]
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .trim();
  const nick = typeof c.nickname === 'string' ? c.nickname.trim() : '';
  const fullNameRaw = typeof c.fullName === 'string' ? c.fullName.trim() : '';
  const fullName = fullNameRaw || part || nick || 'Học viên';

  let avatarUrl: string | null | undefined;
  if (typeof c.avatarUrl === 'string') avatarUrl = c.avatarUrl;
  else if (c.avatarUrl === null) avatarUrl = null;

  return {
    id,
    fullName,
    primaryEmail:
      typeof c.primaryEmail === 'string' ? c.primaryEmail : undefined,
    primaryPhone:
      typeof c.primaryPhone === 'string' ? c.primaryPhone : undefined,
    avatarUrl,
  };
}
