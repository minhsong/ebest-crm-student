/** Bước hiển thị trên thanh tiến trình — góc nhìn học viên. */
export type MockTestOnlineFunnelUiStep =
	| 'register'
	| 'select_exam'
	| 'confirm_zalo'
	| 'exam';

export const MOCK_TEST_ONLINE_FUNNEL_STEPS: Array<{
	key: MockTestOnlineFunnelUiStep;
	title: string;
}> = [
	{ key: 'register', title: 'Đăng ký' },
	{ key: 'select_exam', title: 'Chọn bài thi' },
	{ key: 'confirm_zalo', title: 'Xác minh Zalo' },
	{ key: 'exam', title: 'Làm bài' },
];

export function mockTestOnlineFunnelStepIndex(
	step: MockTestOnlineFunnelUiStep,
): number {
	return MOCK_TEST_ONLINE_FUNNEL_STEPS.findIndex((s) => s.key === step);
}
