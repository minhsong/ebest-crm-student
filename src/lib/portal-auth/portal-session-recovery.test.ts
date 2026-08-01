import { describe, expect, it } from 'vitest';
import {
	buildAuthRequiredLoginHref,
} from './portal-session-recovery';

describe('portal-session-recovery', () => {
	it('guest thuần — login + returnUrl, không session=expired', () => {
		expect(
			buildAuthRequiredLoginHref({ returnUrl: '/profile' }),
		).toBe('/login?returnUrl=%2Fprofile');
	});

	it('JWT expired — gắn session=expired', () => {
		expect(
			buildAuthRequiredLoginHref({
				returnUrl: '/schedule',
				authFailure: 'expired',
			}),
		).toBe('/login?session=expired&returnUrl=%2Fschedule');
	});

	it('relogin_required — cũng gắn session=expired', () => {
		expect(
			buildAuthRequiredLoginHref({
				returnUrl: '/lead/profile',
				authFailure: 'relogin_required',
			}),
		).toBe('/login?session=expired&returnUrl=%2Flead%2Fprofile');
	});
});
