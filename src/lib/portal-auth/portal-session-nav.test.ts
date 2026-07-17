import { describe, expect, it } from 'vitest';
import {
	homePathForClientSession,
	homePathForPortalActor,
	parseClientPortalSessionPayload,
	postLoginPathForPortalActor,
} from './portal-session-nav';

describe('portal-session-nav', () => {
	it('parses session payload fail-safe', () => {
		expect(parseClientPortalSessionPayload(null)).toEqual({ actor: 'guest' });
		expect(parseClientPortalSessionPayload({ actor: 'customer', displayName: '  A ' })).toEqual({
			actor: 'customer',
			displayName: 'A',
		});
	});

	it('maps home / post-login paths', () => {
		expect(homePathForPortalActor('customer')).toBe('/');
		expect(homePathForPortalActor('lead')).toBe('/mock-test');
		expect(homePathForClientSession({ actor: 'guest' })).toBeNull();
		expect(postLoginPathForPortalActor('customer', '/profile')).toBe('/profile');
		expect(postLoginPathForPortalActor('customer', '//evil')).toBe('/');
		expect(postLoginPathForPortalActor('lead', null)).toBe('/mock-test/results');
	});
});
