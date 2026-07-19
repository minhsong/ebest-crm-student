import { describe, expect, it } from 'vitest';
import {
	LEAD_COMPLETE_PROFILE_PATH,
	PORTAL_MOCK_TEST_RESULTS_ROUTES,
	buildLeadCompleteProfilePath,
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

	it('resolvePostLeadLoginPath — chưa hoàn thiện hồ sơ kèm returnUrl', () => {
		expect(
			resolvePostLeadLoginPath(
				{ profileCompleted: false },
				'/mock-test/online/start',
			),
		).toBe(buildLeadCompleteProfilePath('/mock-test/online/start'));
		expect(
			resolvePostLeadLoginPath({ profileCompleted: false }),
		).toBe(
			buildLeadCompleteProfilePath(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead),
		);
	});

	it('resolvePostLeadLoginPath — đã hoàn thiện', () => {
		expect(
			resolvePostLeadLoginPath({ profileCompleted: true }),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
	});
});
