/**
 * Sinh tiêu đề hiển thị / meta từ slug URL (khi chưa có dữ liệu bài từ API phía server).
 */
export function humanizeQaSlug(slug: string): string {
  const s = decodeURIComponent(slug).trim();
  if (!s) return 'Hỏi đáp';
  return s
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
