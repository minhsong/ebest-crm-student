import { describe, expect, it } from 'vitest';
import {
	LEAD_COMPLETE_PROFILE_PATH,
	PORTAL_MOCK_TEST_RESULTS_ROUTES,
	buildLeadCompleteProfilePath,
	isLeadCompleteProfileHref,
	isLeadCompleteProfilePath,
	resolvePostExamPath,
	resolvePostLeadLoginPath,
} from './session-routes';

describe('session-routes', () => {
	it('resolvePostLeadLoginPath — convert → re-login (không silent)', () => {
		expect(
			resolvePostLeadLoginPath({
				identityUpgrade: { available: true, reLoginRequired: true },
				profileCompleted: false,
			}),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
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

	it('resolvePostExamPath — guest phải đăng nhập với returnUrl kết quả', () => {
		expect(resolvePostExamPath({ kind: 'none' })).toBe(
			'/login?returnUrl=%2Fmock-test%2Fresults',
		);
	});

	it('resolvePostExamPath — lead chưa hoàn thiện vào wizard trước kết quả', () => {
		expect(
			resolvePostExamPath({ kind: 'lead', profileCompleted: false }),
		).toBe(
			buildLeadCompleteProfilePath(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead),
		);
	});

	it('resolvePostExamPath — customer hoặc lead hoàn thiện vào kết quả', () => {
		expect(resolvePostExamPath({ kind: 'customer' })).toBe(
			PORTAL_MOCK_TEST_RESULTS_ROUTES.lead,
		);
		expect(
			resolvePostExamPath({ kind: 'lead', profileCompleted: true }),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
	});

	it('resolvePostLeadLoginPath — thiếu profileCompleted → wizard (fail-closed)', () => {
		expect(resolvePostLeadLoginPath({})).toBe(
			buildLeadCompleteProfilePath(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead),
		);
	});

	it('isLeadCompleteProfileHref nhận diện wizard path + query', () => {
		expect(isLeadCompleteProfilePath(LEAD_COMPLETE_PROFILE_PATH)).toBe(true);
		expect(
			isLeadCompleteProfileHref(
				`${LEAD_COMPLETE_PROFILE_PATH}?returnUrl=%2Fmock-test%2Fresults`,
			),
		).toBe(true);
		expect(isLeadCompleteProfileHref('/mock-test/results')).toBe(false);
	});
});
