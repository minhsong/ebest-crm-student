import type {
  MediaReviewComment,
  PronunciationCatalogItem,
  PronunciationReviewCatalog,
} from './types';

export function commentHasFeedback(
  c: Pick<
    MediaReviewComment,
    'ipa' | 'finalSounds' | 'liaison' | 'stress' | 'intonation' | 'note'
  >,
): boolean {
  if ((c.note ?? '').trim()) return true;
  if ((c.ipa?.length ?? 0) > 0) return true;
  if ((c.finalSounds?.length ?? 0) > 0) return true;
  if ((c.liaison?.items?.length ?? 0) > 0) return true;
  if ((c.stress?.items?.length ?? 0) > 0) return true;
  if ((c.intonation?.items?.length ?? 0) > 0) return true;
  return false;
}

export function buildCatalogMaps(catalog: PronunciationReviewCatalog | null) {
  const ipa = new Map<string, PronunciationCatalogItem>();
  const finalSounds = new Map<string, PronunciationCatalogItem>();
  for (const item of catalog?.ipa ?? []) ipa.set(item.code, item);
  for (const item of catalog?.finalSounds ?? []) finalSounds.set(item.code, item);
  return { ipa, finalSounds };
}

export function formatIntonationArrows(arrows: string[]): string {
  return arrows
    .map((a) => (a === 'up' ? '↑' : a === 'down' ? '↓' : '→'))
    .join('');
}

export function commentSummaryText(c: MediaReviewComment): string {
  const parts: string[] = [];
  if ((c.ipa?.length ?? 0) > 0) parts.push(`IPA (${c.ipa!.length})`);
  if ((c.finalSounds?.length ?? 0) > 0)
    parts.push(`Âm cuối (${c.finalSounds!.length})`);
  if ((c.liaison?.items?.length ?? 0) > 0)
    parts.push(`Liaison (${c.liaison!.items.length})`);
  if ((c.stress?.items?.length ?? 0) > 0)
    parts.push(`Stress (${c.stress!.items.length})`);
  if ((c.intonation?.items?.length ?? 0) > 0)
    parts.push(`Intonation (${c.intonation!.items.length})`);
  if ((c.note ?? '').trim()) parts.push('Note');
  return parts.join(' · ') || '—';
}

/** Tóm tắt danh sách (không gồn nhãn Note — note hiển thị dòng riêng). */
export function commentSummaryMetaText(c: MediaReviewComment): string {
  const parts: string[] = [];
  if ((c.ipa?.length ?? 0) > 0) parts.push(`IPA (${c.ipa!.length})`);
  if ((c.finalSounds?.length ?? 0) > 0)
    parts.push(`Âm cuối (${c.finalSounds!.length})`);
  if ((c.liaison?.items?.length ?? 0) > 0)
    parts.push(`Liaison (${c.liaison!.items.length})`);
  if ((c.stress?.items?.length ?? 0) > 0)
    parts.push(`Stress (${c.stress!.items.length})`);
  if ((c.intonation?.items?.length ?? 0) > 0)
    parts.push(`Intonation (${c.intonation!.items.length})`);
  return parts.join(' · ') || '—';
}
