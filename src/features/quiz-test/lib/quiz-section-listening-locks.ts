/**
 * Khóa UI listening theo section — mirror quy tắc §10 (gateway / CRM).
 *
 * - **navLocked / submitLocked:** chưa nghe xong ≥1 vòng playlist section → không chuyển phần / nộp bài.
 * - Sau ≥1 vòng: mở chuyển phần; nếu user rời section khi còn lượt → forfeit (remaining → 0, gateway).
 */

export type SectionListeningLockInput = {
  hasQueue: boolean;
  hasServerQuota: boolean;
  sectionRem: number;
  sectionQuotaMax?: number | null;
  localCyclesCompleted: number;
};

export type SectionListeningLocks = {
  navLocked: boolean;
  submitLocked: boolean;
};

export function computeListeningCyclesConsumed(
  sectionQuotaMax: number | null | undefined,
  sectionRem: number,
): number {
  if (typeof sectionQuotaMax !== 'number' || !Number.isFinite(sectionQuotaMax)) {
    return 0;
  }
  if (!Number.isFinite(sectionRem)) {
    return 0;
  }
  return Math.max(0, sectionQuotaMax - sectionRem);
}

export function hasHeardSectionListeningAtLeastOnce(
  input: Pick<
    SectionListeningLockInput,
    'hasQueue' | 'hasServerQuota' | 'sectionQuotaMax' | 'sectionRem' | 'localCyclesCompleted'
  >,
): boolean {
  if (!input.hasQueue || !input.hasServerQuota) {
    return true;
  }
  return (
    computeListeningCyclesConsumed(input.sectionQuotaMax, input.sectionRem) >= 1 ||
    input.localCyclesCompleted >= 1
  );
}

export function computeSectionListeningLocks(
  input: SectionListeningLockInput,
): SectionListeningLocks {
  if (!input.hasQueue || !input.hasServerQuota) {
    return { navLocked: false, submitLocked: false };
  }
  const heardOnce = hasHeardSectionListeningAtLeastOnce(input);
  // Chỉ khóa trước vòng đầu; lượt 2+ vẫn phát nền — không chặn chuyển phần / nộp bài (§SECTION_LISTENING_POLICY).
  return {
    navLocked: !heardOnce,
    submitLocked: !heardOnce,
  };
}

export function getSectionListeningStatusSuffix(
  sectionRem: number,
  heardAtLeastOnce: boolean,
): string | null {
  if (sectionRem <= 0) {
    return null;
  }
  return heardAtLeastOnce
    ? ' Bạn có thể chuyển phần; lượt nghe còn lại sẽ hết nếu rời phần này.'
    : ' Nghe xong một lượt (hết chuỗi audio) để chuyển phần hoặc nộp bài.';
}

export const LISTENING_SUBMIT_LOCKED_TOOLTIP =
  'Nghe xong ít nhất một lượt phần nghe (hết chuỗi audio) để tiếp tục.';

export const LISTENING_NAV_LOCKED_TOOLTIP =
  'Nghe xong ít nhất một lượt phần nghe (hết chuỗi audio) trước khi chuyển phần.';
