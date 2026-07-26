import { describe, expect, it } from 'vitest';
import { toClientPortalSessionPayload } from './portal-session-client.util';
import type { PortalSessionPayload } from './resolve-portal-session.server';

describe('toClientPortalSessionPayload', () => {
	it('strips lead internals to displayName only (PI-D18)', () => {
		const leadSession = {
			actor: 'lead',
			displayName: 'An',
			omniLeadId: 'abc',
			accountId: '9',
			profile: { omniLeadId: 'abc' },
		} as PortalSessionPayload;
		expect(toClientPortalSessionPayload(leadSession)).toEqual({
			actor: 'lead',
			displayName: 'An',
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
			}),
		).toEqual({ actor: 'customer', displayName: 'HV' });
	});
});
