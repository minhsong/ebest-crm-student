/** Nhận diện HTML từ TipTap / rich editor (CRM ↔ Portal). */
export function looksLikeRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value.trim());
}

export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
