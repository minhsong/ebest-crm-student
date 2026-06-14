'use client';

import type { VocabularyDrillDetailWidgetId } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { AudioMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/AudioMcqPrompt';
import { MeaningMcqPrompt } from '@/features/learning/games/vocabulary-drill/presentation/detail/MeaningMcqPrompt';

type Props = {
  detailWidgetId: VocabularyDrillDetailWidgetId;
  prompt: string;
  promptAudioUrl?: string;
};

export function VocabularyDrillPromptDetail({
  detailWidgetId,
  prompt,
  promptAudioUrl,
}: Props) {
  return (
    <div className="drill-prompt-card">
      {detailWidgetId === 'audio_mcq' && promptAudioUrl ? (
        <AudioMcqPrompt promptAudioUrl={promptAudioUrl} />
      ) : (
        <MeaningMcqPrompt prompt={prompt} />
      )}
    </div>
  );
}
