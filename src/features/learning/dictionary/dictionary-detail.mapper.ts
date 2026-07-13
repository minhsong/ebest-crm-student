import type {
  DictionaryDetailPayload,
  DictionaryProgressPayload,
  LearningVocabularyItem,
  VocabularyFamilyMemberSummary,
} from '@/types/learning';

export function mapDictionaryDetailToLearningItem(
  detail: DictionaryDetailPayload,
  progress: DictionaryProgressPayload | null,
): LearningVocabularyItem {
  const asset = detail.asset;
  const familyMembers: VocabularyFamilyMemberSummary[] = (
    asset.familyMembers ?? []
  ).map((member) => ({
    id: member.assetId,
    word: member.word,
    partOfSpeech: member.partOfSpeech,
    displayLabel: member.displayLabel,
    translationPreview: member.translationPreview,
    isPrimary: member.isPrimary,
  }));

  return {
    order: 0,
    asset: {
      id: asset.id,
      assetType: 'vocabulary',
      word: asset.word,
      translations: asset.translations,
      translationPreview: asset.translations?.vi,
      meaningEn: asset.meaningEn,
      partOfSpeech: asset.partOfSpeech,
      partOfSpeechLabel: asset.partOfSpeechLabel,
      displayLabel: asset.displayLabel,
      familyMembers,
      ipaUk: asset.ipaUk,
      ipaUs: asset.ipaUs,
      example: asset.example,
      exampleTranslation: asset.exampleTranslation,
      audioUkUrl: asset.audioUkUrl,
      audioUsUrl: asset.audioUsUrl,
      imageUrl: asset.imageUrl,
      synonyms: asset.synonyms,
      antonyms: asset.antonyms,
      domainTags: asset.domainTags,
      status: 'active',
    },
    progress: {
      assetId: asset.id,
      masteryState: (progress?.masteryState ?? 'new') as LearningVocabularyItem['progress']['masteryState'],
      masteryLabel: progress?.masteryLabel ?? 'Chưa luyện tập',
      firstSeenAt: null,
      lastSeenAt: null,
      timesSeen: progress?.timesSeen ?? 0,
      knownCount: 0,
      unknownCount: 0,
      accuracyRate: progress?.accuracyRate ?? null,
      lastQuizAt: null,
    },
  };
}
