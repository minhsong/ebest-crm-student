import type {
  DictionaryDetailPayload,
  DictionaryLookupSource,
  DictionaryProgressPayload,
  DictionarySearchPayload,
  DictionarySuggestPayload,
} from '@/types/learning';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length ? items : undefined;
}

function mapPractice(raw: Record<string, unknown> | null | undefined) {
  if (!raw) return undefined;
  const canPractice = raw.canPractice === true;
  return {
    canPractice,
    reason: asString(raw.reason),
    flashcardHref: asString(raw.flashcardHref),
    drillHref: asString(raw.drillHref),
  };
}

function mapFamilyMembers(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const assetId = asNumber(row.assetId);
      const word = asString(row.word);
      const partOfSpeech = asString(row.partOfSpeech);
      const displayLabel = asString(row.displayLabel);
      const translationPreview = asString(row.translationPreview);
      if (!assetId || !word || !partOfSpeech || !displayLabel || !translationPreview) {
        return null;
      }
      return {
        assetId,
        word,
        partOfSpeech,
        displayLabel,
        translationPreview,
        isPrimary: row.isPrimary === true,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function mapDomainTags(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => {
      const row = asRecord(item);
      const code = asString(row?.code);
      const name = asString(row?.name);
      if (!code || !name) return null;
      return { code, name };
    })
    .filter((item): item is { code: string; name: string } => Boolean(item));
}

function mapTranslations(value: unknown): Record<string, string> {
  const raw = asRecord(value);
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === 'string' && val.trim()) {
      out[key] = val;
    }
  }
  return out;
}

export function mapDictionarySuggestPayload(raw: unknown): DictionarySuggestPayload {
  const body = asRecord(raw) ?? {};
  const items = Array.isArray(body.items)
    ? body.items
        .map((item) => {
          const row = asRecord(item);
          const assetId = asNumber(row?.assetId);
          const word = asString(row?.word);
          const partOfSpeech = asString(row?.partOfSpeech);
          const displayLabel = asString(row?.displayLabel);
          const translationPreview = asString(row?.translationPreview);
          if (!assetId || !word || !partOfSpeech || !displayLabel || !translationPreview) {
            return null;
          }
          return { assetId, word, partOfSpeech, displayLabel, translationPreview };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const meta = asRecord(body.meta);
  return {
    items,
    meta: {
      query: asString(meta?.query) ?? '',
      count: asNumber(meta?.count) ?? items.length,
    },
  };
}

export function mapDictionarySearchPayload(raw: unknown): DictionarySearchPayload {
  const body = asRecord(raw) ?? {};
  const items = Array.isArray(body.items)
    ? body.items
        .map((item) => {
          const row = asRecord(item);
          const assetId = asNumber(row?.assetId);
          const word = asString(row?.word);
          const partOfSpeech = asString(row?.partOfSpeech);
          const displayLabel = asString(row?.displayLabel);
          const translationPreview = asString(row?.translationPreview);
          if (!assetId || !word || !partOfSpeech || !displayLabel || !translationPreview) {
            return null;
          }
          return {
            assetId,
            word,
            partOfSpeech,
            partOfSpeechLabel: asString(row?.partOfSpeechLabel),
            displayLabel,
            translationPreview,
            hasAudio: row?.hasAudio === true,
            hasImage: row?.hasImage === true,
            isPrimary: row?.isPrimary === true,
            siblingCount: asNumber(row?.siblingCount) ?? 0,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const pagination = asRecord(body.pagination);
  const meta = asRecord(body.meta);
  return {
    items,
    pagination: {
      total: asNumber(pagination?.total) ?? 0,
      current: asNumber(pagination?.current) ?? 1,
      pageSize: asNumber(pagination?.pageSize) ?? 20,
      totalPages: asNumber(pagination?.totalPages) ?? 0,
    },
    meta: { query: asString(meta?.query) ?? '' },
  };
}

export function mapDictionaryDetailPayload(raw: unknown): DictionaryDetailPayload {
  const body = asRecord(raw) ?? {};
  const asset = asRecord(body.asset);
  const id = asNumber(asset?.id);
  const word = asString(asset?.word);
  const partOfSpeech = asString(asset?.partOfSpeech);
  const displayLabel = asString(asset?.displayLabel);
  if (!asset || !id || !word || !partOfSpeech || !displayLabel) {
    throw new Error('Invalid dictionary detail payload');
  }

  return {
    asset: {
      id,
      word,
      partOfSpeech,
      partOfSpeechLabel: asString(asset.partOfSpeechLabel),
      displayLabel,
      meaningEn: asString(asset.meaningEn),
      translations: mapTranslations(asset.translations),
      ipaUk: asString(asset.ipaUk),
      ipaUs: asString(asset.ipaUs),
      audioUkUrl: asString(asset.audioUkUrl),
      audioUsUrl: asString(asset.audioUsUrl),
      imageUrl: asString(asset.imageUrl),
      example: asString(asset.example),
      exampleTranslation: asString(asset.exampleTranslation),
      synonyms: asStringArray(asset.synonyms),
      antonyms: asStringArray(asset.antonyms),
      domainTags: mapDomainTags(asset.domainTags),
      familyMembers: mapFamilyMembers(asset.familyMembers),
    },
    practice: mapPractice(asRecord(body.practice)),
  };
}

export function mapDictionaryProgressPayload(raw: unknown): DictionaryProgressPayload {
  const body = asRecord(raw) ?? {};
  const assetId = asNumber(body.assetId);
  const masteryState = asString(body.masteryState);
  const masteryLabel = asString(body.masteryLabel);
  if (!assetId || !masteryState || !masteryLabel) {
    throw new Error('Invalid dictionary progress payload');
  }
  return {
    assetId,
    masteryState,
    masteryLabel,
    timesSeen: asNumber(body.timesSeen) ?? 0,
    accuracyRate:
      body.accuracyRate === null ? null : (asNumber(body.accuracyRate) ?? null),
  };
}

export function isDictionaryLookupSource(value: string | null): value is DictionaryLookupSource {
  return value === 'suggest' || value === 'search' || value === 'direct';
}
