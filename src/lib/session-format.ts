/** Định dạng hiển thị ngày/giờ buổi học (student portal). */

export function formatSessionTimeShort(t: string): string {
  if (typeof t !== 'string') return '—';
  const part = t.split(':').slice(0, 2).join(':');
  return part || '—';
}

export function formatSessionDateVi(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/** Một dòng: ngày (ngắn) + khung giờ — dùng trên card lịch học. */
export function formatSessionDatetimeCompact(
  isoDate: string,
  start: string,
  end: string,
): string {
  try {
    const d = new Date(isoDate);
    const datePart = d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    return `${datePart} · ${formatSessionTimeShort(start)}–${formatSessionTimeShort(end)}`;
  } catch {
    return `${isoDate} · ${formatSessionTimeShort(start)}–${formatSessionTimeShort(end)}`;
  }
}
