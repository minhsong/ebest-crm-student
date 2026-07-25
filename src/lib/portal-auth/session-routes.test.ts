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
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

describe('session-routes', () => {
	it('resolvePostLeadLoginPath — convert → re-login (không silent)', () => {
		expect(
			resolvePostLeadLoginPath({
				identityUpgrade: { available: true, reLoginRequired: true },
				profileCompleted: false,
			}),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.login);
	});

	it('resolvePostLeadLoginPath — chưa hoàn thiện hồ sơ → hub (bài đầu PO-D30)', () => {
		expect(
			resolvePostLeadLoginPath(
				{ profileCompleted: false },
				'/mock-test/online/start',
			),
		).toBe(PORTAL_MOCK_TEST_ROUTES.hub);
		expect(resolvePostLeadLoginPath({ profileCompleted: false })).toBe(
			PORTAL_MOCK_TEST_ROUTES.hub,
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
		expect(
			resolvePostExamPath({ kind: 'customer', profileCompleted: true }),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
		expect(
			resolvePostExamPath({ kind: 'lead', profileCompleted: true }),
		).toBe(PORTAL_MOCK_TEST_RESULTS_ROUTES.lead);
	});

	it('resolvePostExamPath — customer thiếu SĐT → hub notice', () => {
		expect(
			resolvePostExamPath({ kind: 'customer', profileCompleted: false }),
		).toBe(`${PORTAL_MOCK_TEST_ROUTES.hub}?notice=profile_required`);
	});

	it('resolvePostLeadLoginPath — thiếu profileCompleted → hub (không ép wizard)', () => {
		expect(resolvePostLeadLoginPath({})).toBe(PORTAL_MOCK_TEST_ROUTES.hub);
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
