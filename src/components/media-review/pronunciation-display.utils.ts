import type {
  MediaReviewComment,
  PronunciationCatalogItem,
  PronunciationReviewCatalog,
} from './types';

export function getFinalSoundDisplayLabel(
  item?: PronunciationCatalogItem | null,
  fallbackCode?: string,
): string {
  if (!item) return fallbackCode ?? '';
  const ipa = item.correctionLabel?.trim();
  if (ipa) return ipa;
  return item.label.replace(/^Final\s+/i, '').trim() || fallbackCode || item.code;
}

export function getIpaDisplayLabel(
  item?: PronunciationCatalogItem | null,
  fallbackCode?: string,
): string {
  if (!item) return fallbackCode ?? '';
  return item.correctionLabel ?? item.label ?? fallbackCode ?? item.code;
}

function buildCommentSummaryParts(
  c: MediaReviewComment,
  includeNote: boolean,
): string[] {
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
  if (includeNote && (c.note ?? '').trim()) parts.push('Note');
  return parts;
}

export function commentSummaryText(c: MediaReviewComment): string {
  return buildCommentSummaryParts(c, true).join(' · ') || '—';
}

export function commentSummaryMetaText(c: MediaReviewComment): string {
  return buildCommentSummaryParts(c, false).join(' · ') || '—';
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
