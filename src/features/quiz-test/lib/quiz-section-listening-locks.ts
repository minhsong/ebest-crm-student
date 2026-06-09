/**
 * Khóa UI listening theo section — mirror quy tắc §10 (gateway / CRM).
 *
 * - **navLocked:** chưa nghe hết lượt còn lại → không chuyển phần.
 * - **submitLocked:** chưa nghe xong ≥1 vòng → không nộp bài.
 */

export type SectionListeningLockInput = {
  hasQueue: boolean;
  hasServerQuota: boolean;
  sectionRem: number;
  sectionQuotaMax?: number | null;
  localCyclesCompleted: number;
  playbackBusy: boolean;
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
  return {
    navLocked: input.sectionRem > 0 || input.playbackBusy,
    submitLocked: !hasHeardSectionListeningAtLeastOnce(input),
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
    ? ' Bạn có thể nộp bài; chuyển phần khác cần nghe hết lượt còn lại.'
    : ' Nghe xong một lượt để mở nút Nộp bài; chuyển phần cần hết lượt nghe.';
}

export const LISTENING_SUBMIT_LOCKED_TOOLTIP =
  'Nghe xong ít nhất một lượt phần nghe để nộp bài.';

export const LISTENING_NAV_LOCKED_TOOLTIP =
  'Hoàn thành hết lượt phần nghe của phần này trước khi chuyển.';
