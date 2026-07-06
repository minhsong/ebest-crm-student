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
 * | B1 intake | — | `lead-pending:{pendingLeadId}` TTL ~24h | Cookie `mto_pending_lead` 7d; xóa localStorage draft |
 * | B2 select-exam POST | body `pendingLeadId` | **Xóa** lead; tạo `pending:{uuid}` + `lead-selected:{leadId}`→pending | localStorage select-exam cache 7d |
 * | B2c confirm | `pending` **bắt buộc** (+ lead/session lịch sử) | `pending` + `zaloConfirmTokenPlain` | — |
 * | B3 exam | sessionStorage exam auth | PG registration; mã 6 ký tự TTL ≤30 phút | — |
 *
 * Recovery khi Redis hết hạn / bookmark URL cũ:
 * - **Luôn** về `/mock-test-online` (entry tự route register hoặc resume exam nếu còn auth hợp lệ).
 * - **Không** gợi ý `select-exam?lead=…` sau khi đã POST B2 — lead thường đã xóa.
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
