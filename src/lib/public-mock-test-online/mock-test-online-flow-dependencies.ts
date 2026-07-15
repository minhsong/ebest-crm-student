/**
 * SSOT Portal — phụ thuộc dữ liệu từng bước thi thử online public.
 * Canonical server: ebest-crm-api/docs/modules/mock-test/MOCK_TEST_PUBLIC_ONLINE_FLOW_DEPENDENCIES.md
 */

export const MOCK_TEST_ONLINE_PATHS = {
	landing: '/mock-test-online',
	register: '/mock-test-online/register',
	selectExam: '/mock-test-online/select-exam',
	confirmExam: '/mock-test-online/confirm-exam',
} as const;

/** Bước funnel — thứ tự bắt buộc. */
export type MockTestOnlineFunnelStep =
	| 'landing'
	| 'b1_register_intake'
	| 'b2_select_exam'
	| 'b2c_confirm_zalo'
	| 'b3_exam';

/**
 * Ma trận phụ thuộc (đọc trước khi sửa recovery UI):
 *
 * | Bước | URL params hợp lệ | Redis / state server | Sau bước này |
 * |------|-------------------|----------------------|--------------|
 * | B1 intake | — | FunnelSession `lead-pending:{id}` resumeStep=select · TTL funnel | Cookie `mto_funnel_session` (+ dual `mto_pending_lead`) 7d |
 * | B2 select-exam POST | body `pendingLeadId` | **Giữ** FunnelSession; set resumeStep=verify + pendingRegistrationId; Portal BFF **không** clear cookie | localStorage select-exam cache 7d |
 * | B2c confirm | `pending` **bắt buộc** (+ lead/session) | `pending` + FunnelSession resume verify | — |
 * | B3 authorize OK | sessionStorage / httpOnly exam auth | PG registration; **clear** cookie funnel | Exam ready/run |
 *
 * Recovery:
 * - Cookie funnel còn + resumeStep=verify → `/confirm-exam?pending=…` (register page).
 * - Cookie funnel còn + resumeStep=select → `/select-exam?lead=…`.
 * - Redis hết hạn → `/mock-test-online` restart.
 */
export type MockTestOnlineRecoveryKind = 'restart_landing';

export function getMockTestOnlineRecoveryHref(
	_kind: MockTestOnlineRecoveryKind = 'restart_landing',
): string {
	return MOCK_TEST_ONLINE_PATHS.landing;
}

export function mockTestOnlineRestartDescription(step: MockTestOnlineFunnelStep): string {
	switch (step) {
		case 'b2c_confirm_zalo':
			return 'Phiên xác minh đã hết hạn hoặc liên kết không còn dùng được. Vui lòng đăng ký lại và chọn bài thi từ đầu.';
		case 'b2_select_exam':
			return 'Thông tin đăng ký tạm đã hết hạn hoặc đã được dùng. Vui lòng đăng ký lại.';
		default:
			return 'Phiên làm việc đã hết hạn. Vui lòng bắt đầu lại từ trang thi thử online.';
	}
}
