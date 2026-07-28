import { describe, expect, it } from 'vitest';
import { toClientPortalSessionPayload } from './portal-session-client.util';
import type { PortalSessionPayload } from './resolve-portal-session.server';

describe('toClientPortalSessionPayload', () => {
	it('strips lead internals from SSR seed (PI-D18)', () => {
		const leadSession = {
			actor: 'lead',
			displayName: 'An',
			omniLeadId: 'abc',
			accountId: '9',
			profile: {
				id: 9,
				displayName: 'An',
				email: 'lead@example.com',
				phoneE164: '8499',
				emailVerifiedAt: null,
				omniLeadId: 'abc',
				profileCompleted: true,
				profileCompletedAt: null,
				googleLinked: false,
				identityUpgrade: {
					available: true,
					customerId: 10,
				},
			},
		} as PortalSessionPayload;
		expect(toClientPortalSessionPayload(leadSession)).toEqual({
			actor: 'lead',
			displayName: 'An',
			profile: {
				id: 9,
				displayName: 'An',
				email: 'lead@example.com',
				phoneE164: '8499',
				emailVerifiedAt: null,
				profileCompleted: true,
				profileCompletedAt: null,
				googleLinked: false,
			},
		});
	});

	it('maps guest and customer', () => {
		expect(toClientPortalSessionPayload({ actor: 'guest' })).toEqual({ actor: 'guest' });
		expect(
			toClientPortalSessionPayload({
				actor: 'customer',
				displayName: 'HV',
				accountId: '42',
				customer: { id: 1, fullName: 'HV' },
				classes: [{ id: 100, name: 'Lớp A', status: 'READY' }],
			}),
		).toEqual({
			actor: 'customer',
			displayName: 'HV',
			customer: { id: 1, fullName: 'HV' },
			classes: [{ id: 100, name: 'Lớp A', status: 'READY' }],
		});
	});
});
