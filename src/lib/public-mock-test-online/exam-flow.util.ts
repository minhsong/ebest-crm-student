/** Nhãn loại thi + helper URL Zalo — tách khỏi select-exam cache. */

import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { buildMockTestOnlineExamRunPath } from '@/lib/public-mock-test-online/mock-test-online-exam-url.util';

const TEST_TYPE_LABELS: Record<string, string> = {
	toeic_lr: 'TOEIC Listening & Reading',
	communication: 'Giao tiếp',
	kids: 'Thiếu nhi',
	vstep: 'VSTEP',
};

export function mockTestOnlineTypeLabel(code: string | null | undefined): string {
	if (!code?.trim()) return 'Khác';
	return TEST_TYPE_LABELS[code] ?? code.toUpperCase();
}

/** Hiển thị hạn đăng ký chiến dịch (vi-VN). */
export function formatMockTestRegistrationDeadline(
	iso: string | null | undefined,
): string | null {
	if (!iso?.trim()) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

export function mockTestVariantChoiceLabel(
	variant: 'full' | 'mini' | null | undefined,
): string {
	if (variant === 'mini') return 'Đề rút gọn (50 câu)';
	if (variant === 'full') return 'Đề đầy đủ (200 câu)';
	return '';
}

export function groupCampaignsByTestType<
	T extends { testTypeCode: string; sessionId: number },
>(campaigns: T[]): Array<{ testTypeCode: string; label: string; items: T[] }> {
	const map = new Map<string, T[]>();
	for (const c of campaigns) {
		const key = c.testTypeCode?.trim() || 'other';
		const list = map.get(key) ?? [];
		list.push(c);
		map.set(key, list);
	}
	return [...map.entries()].map(([testTypeCode, items]) => ({
		testTypeCode,
		label: mockTestOnlineTypeLabel(testTypeCode),
		items,
	}));
}

export function parseZaloConfirmMessage(deepLink: string): string {
	try {
		const u = new URL(deepLink);
		const msg = u.searchParams.get('msg');
		return msg ? decodeURIComponent(msg) : '';
	} catch {
		return '';
	}
}

/** URL resume khi `in_exam` active (BL-Q2 / LP-EXAM-03). */
export function buildMockTestOnlineInExamResumePath(
	status: MockTestOnlineAttemptStatus,
): string {
	const active = status.activeInExam;
	if (!active?.resumeAllowed) return '/mock-test-online/register';

	return buildMockTestOnlineExamRunPath({
		registrationId: active.registrationId,
	});
}

export {
	clearMockTestOnlineSelectExamCache,
	hasActiveExamSessionToken,
	isSelectExamCacheRecoverable,
	patchSelectExamCache,
	patchSelectExamCacheSession,
	readAnyActiveExamSessionToken,
	readSelectExamCache,
	readSelectExamCacheByPending,
	writeSelectExamCache,
	buildMockTestOnlineConfirmExamPath,
	type CachedSelectExamResult,
} from './select-exam-cache';

export { MOCK_TEST_ONLINE_LOCAL_RETENTION_MS } from './mock-test-online-intake-draft';
