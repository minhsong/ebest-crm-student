/** Chuẩn hóa mã làm bài 6 ký tự — đồng bộ GW `normalizeExamUnlockCode`. */
export function normalizeMockTestUnlockCode(raw: string): string {
	return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export const MOCK_TEST_UNLOCK_CODE_LENGTH = 6;

export function isValidMockTestUnlockCode(raw: string): boolean {
	const normalized = normalizeMockTestUnlockCode(raw);
	return normalized.length === MOCK_TEST_UNLOCK_CODE_LENGTH;
}

export const mockTestUnlockCodeFormRules = [
	{
		validator: (_: unknown, value: string | undefined) => {
			if (!value?.trim()) {
				return Promise.reject(new Error('Vui lòng nhập mã làm bài.'));
			}
			if (!isValidMockTestUnlockCode(value)) {
				return Promise.reject(
					new Error(`Mã làm bài gồm ${MOCK_TEST_UNLOCK_CODE_LENGTH} ký tự.`),
				);
			}
			return Promise.resolve();
		},
	},
];
