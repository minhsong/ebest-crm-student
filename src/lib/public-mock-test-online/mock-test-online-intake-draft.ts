import type { MockTestOnlineRegisterFormValues } from './types';

const INTAKE_DRAFT_KEY = 'mock-test-online:intake-draft:v1';

/** Lưu tạm form đăng ký khi chưa hoàn tất intake / đang chờ xác nhận. */
export const MOCK_TEST_ONLINE_LOCAL_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type IntakeDraftEnvelope = {
	savedAt: string;
	values: Partial<MockTestOnlineRegisterFormValues>;
};

function isBrowserStorage(): boolean {
	return typeof localStorage !== 'undefined';
}

export function readIntakeDraft(): Partial<MockTestOnlineRegisterFormValues> | null {
	if (!isBrowserStorage()) return null;
	try {
		const raw = localStorage.getItem(INTAKE_DRAFT_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as IntakeDraftEnvelope;
		const savedAt = Date.parse(parsed.savedAt);
		if (!Number.isFinite(savedAt)) return null;
		if (Date.now() - savedAt > MOCK_TEST_ONLINE_LOCAL_RETENTION_MS) {
			localStorage.removeItem(INTAKE_DRAFT_KEY);
			return null;
		}
		return parsed.values ?? null;
	} catch {
		return null;
	}
}

export function writeIntakeDraft(
	values: Partial<MockTestOnlineRegisterFormValues>,
): void {
	if (!isBrowserStorage()) return;
	try {
		const envelope: IntakeDraftEnvelope = {
			savedAt: new Date().toISOString(),
			values,
		};
		localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify(envelope));
	} catch {
		// ignore quota
	}
}

export function clearIntakeDraft(): void {
	if (!isBrowserStorage()) return;
	try {
		localStorage.removeItem(INTAKE_DRAFT_KEY);
	} catch {
		// ignore
	}
}
