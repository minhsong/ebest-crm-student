import type { LeadTestResultSummary } from '@/lib/lead-portal/types';

export function getMockTestDeliveryModeTag(
  deliveryMode: LeadTestResultSummary['deliveryMode'],
): string | null {
  if (deliveryMode === 'online') return 'Online';
  if (deliveryMode === 'offline') return 'Tại trung tâm';
  return null;
}

export function getMockTestResultTitle(item: LeadTestResultSummary): string {
  return item.sessionTitle?.trim() || `Đăng ký #${item.registrationId}`;
}

export function formatMockTestScoreLine(
  scores: NonNullable<LeadTestResultSummary['scores']>,
): string {
  return `Nghe: ${scores.listening} · Đọc: ${scores.reading} · Tổng: ${scores.total}`;
}

export function formatMockTestScoredAt(scoredAt: string | null): string | null {
  if (!scoredAt?.trim()) return null;
  const d = new Date(scoredAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
