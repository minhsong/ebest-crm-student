import { describe, expect, it } from 'vitest';
import {
	LEAD_COMPLETE_PROFILE_PATH,
	PORTAL_MOCK_TEST_RESULTS_ROUTES,
	resolvePostLeadLoginPath,
} from './session-routes';

describe('session-routes', () => {
	it('resolvePostLeadLoginPath — identity upgrade ưu tiên', () => {
		expect(
			resolvePostLeadLoginPath({
				identityUpgrade: { applied: true },
				profileCompleted: false,
			}),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.student);
	});

	it('resolvePostLeadLoginPath — chưa hoàn thiện hồ sơ', () => {
		expect(
			resolvePostLeadLoginPath({ profileCompleted: false }),
		).toBe(LEAD_COMPLETE_PROFILE_PATH);
	});

	it('resolvePostLeadLoginPath — đã hoàn thiện', () => {
		expect(
			resolvePostLeadLoginPath({ profileCompleted: true }),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
	});
});
