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
			customer: { id: 0, fullName: 'Học viên' },
			classes: [],
		});
	});

	it('maps home / post-login paths', () => {
		expect(homePathForPortalActor('customer')).toBe('/');
		expect(homePathForPortalActor('lead')).toBe('/mock-test');
		expect(homePathForClientSession({ actor: 'guest' })).toBeNull();
		expect(postLoginPathForPortalActor('customer', '/profile')).toBe('/profile');
		expect(postLoginPathForPortalActor('customer', '//evil')).toBe('/');
		expect(postLoginPathForPortalActor('customer', null)).toBe('/');
		expect(postLoginPathForPortalActor('lead', null)).toBe('/mock-test');
		expect(
			postLoginPathForPortalActor('lead', '/mock-test/results'),
		).toBe('/mock-test/results');
	});
});
