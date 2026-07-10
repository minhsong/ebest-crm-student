'use client';

import type { VocabularyDrillDetailWidgetId } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { AudioMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/AudioMcqPrompt';
import { ImageMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/ImageMcqPrompt';
import { MeaningMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/MeaningMcqPrompt';
import { WordStemMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/WordStemMcqPrompt';

type Props = {
  detailWidgetId: VocabularyDrillDetailWidgetId;
  prompt: string;
  promptAudioUrl?: string;
  promptImageUrl?: string;
};

export function VocabularyDrillPromptDetail({
  detailWidgetId,
  prompt,
  promptAudioUrl,
  promptImageUrl,
}: Props) {
  return (
    <div className="drill-prompt-card">
      {detailWidgetId === 'audio_mcq' && promptAudioUrl ? (
        <AudioMcqPrompt promptAudioUrl={promptAudioUrl} />
      ) : detailWidgetId === 'image_mcq' && promptImageUrl ? (
        <ImageMcqPrompt promptImageUrl={promptImageUrl} />
      ) : detailWidgetId === 'word_image_mcq' ? (
        <WordStemMcqPrompt prompt={prompt} />
      ) : (
        <MeaningMcqPrompt prompt={prompt} />
      )}
    </div>
  );
}
