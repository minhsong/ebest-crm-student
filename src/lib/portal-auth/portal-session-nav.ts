import type { ClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import { parseStudentMeCustomerBrief } from '@/lib/parse-student-me-customer';
import {
	resolvePostPortalLoginPath,
} from '@/lib/portal-auth/session-routes';
import { sanitizePortalReturnUrl } from '@/lib/portal-auth/post-auth-return-url';

/** Parse JSON body từ `/api/portal/session` — fail-safe guest. */
export function parseClientPortalSessionPayload(
	data: unknown,
): ClientPortalSessionPayload {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { actor: 'guest' };
	}
	const o = data as Record<string, unknown>;
	if (o.actor === 'customer') {
		const customer = parseStudentMeCustomerBrief(o.customer) ?? {
			id: 0,
			fullName: 'Học viên',
		};
		const classes = Array.isArray(o.classes)
			? o.classes
					.map((item) => {
						if (!item || typeof item !== 'object') return null;
						const row = item as Record<string, unknown>;
						const id = Number(row.id);
						const name = typeof row.name === 'string' ? row.name.trim() : '';
						const status =
							typeof row.status === 'string' || row.status === null
								? (row.status as string | null)
								: null;
						if (!Number.isFinite(id) || !name) return null;
						return { id, name, status };
					})
					.filter(Boolean) as Array<{
						id: number;
						name: string;
						status?: string | null;
					}>
			: [];
		return {
			actor: 'customer',
			displayName:
				typeof o.displayName === 'string' && o.displayName.trim()
					? o.displayName.trim()
					: 'Học viên',
			customer,
			classes,
		};
	}
	if (o.actor === 'lead') {
		const profileRaw =
			o.profile && typeof o.profile === 'object'
				? (o.profile as Record<string, unknown>)
				: {};
		return {
			actor: 'lead',
			displayName:
				typeof o.displayName === 'string' && o.displayName.trim()
					? o.displayName.trim()
					: 'Thí sinh',
			profile: {
				id: Number(profileRaw.id ?? 0),
				displayName:
					typeof profileRaw.displayName === 'string'
						? profileRaw.displayName
						: null,
				email:
					typeof profileRaw.email === 'string' ? profileRaw.email : '',
				phoneE164:
					typeof profileRaw.phoneE164 === 'string'
						? profileRaw.phoneE164
						: null,
				emailVerifiedAt:
					typeof profileRaw.emailVerifiedAt === 'string'
						? profileRaw.emailVerifiedAt
						: null,
				profileCompleted: profileRaw.profileCompleted === true,
				passwordSetupRequired: profileRaw.passwordSetupRequired === true,
				profileCompletedAt:
					typeof profileRaw.profileCompletedAt === 'string'
						? profileRaw.profileCompletedAt
						: null,
				googleLinked: profileRaw.googleLinked === true,
			},
		};
	}
	return { actor: 'guest' };
}

/** Home zone khi đã login (chrome / redirect-if-logged-in). */
export function homePathForPortalActor(
	actor: 'customer' | 'lead',
): string {
	return resolvePostPortalLoginPath(actor);
}

/** Redirect sau login form — có returnUrl an toàn thì theo intent; không thì trang chủ. */
export function postLoginPathForPortalActor(
	actor: 'customer' | 'lead',
	explicitRedirect?: string | null,
): string {
	const safeReturnUrl = sanitizePortalReturnUrl(explicitRedirect);
	if (safeReturnUrl) return safeReturnUrl;
	return resolvePostPortalLoginPath(actor);
}

export function homePathForClientSession(
	session: ClientPortalSessionPayload,
): string | null {
	if (session.actor === 'guest') return null;
	return homePathForPortalActor(session.actor);
}
