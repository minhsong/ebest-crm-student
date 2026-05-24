export type IntonationArrow = 'up' | 'down' | 'flat';

export interface LiaisonItem {
  word1: string;
  word2: string;
  linkSound?: string;
}

export interface LiaisonFeedback {
  items: LiaisonItem[];
}

export interface StressItem {
  word: string;
  stressedSyllable: string;
}

export interface StressFeedback {
  items: StressItem[];
}

export interface IntonationItem {
  text: string;
  arrows: IntonationArrow[];
}

export interface IntonationFeedback {
  items: IntonationItem[];
}

export interface MediaReviewComment {
  id: string;
  startMs: number;
  ipa?: string[];
  finalSounds?: string[];
  liaison?: LiaisonFeedback;
  stress?: StressFeedback;
  intonation?: IntonationFeedback;
  note?: string;
  updatedAt?: string;
}

export interface AssignmentResultMediaReview {
  version: 2;
  attachments: Record<
    string,
    {
      durationMs?: number;
      comments: MediaReviewComment[];
    }
  >;
}

export type MediaTimelineReviewKind = 'audio' | 'video';

export interface PronunciationCatalogItem {
  code: string;
  label: string;
  correctionLabel?: string;
  group?: string;
  hintVi?: string;
}

export interface PronunciationReviewCatalog {
  version: number;
  ipa: PronunciationCatalogItem[];
  finalSounds: PronunciationCatalogItem[];
}

export interface MediaTimelineReviewProps {
  mode: 'view';
  mediaUrl: string;
  mediaKind: MediaTimelineReviewKind;
  mediaTitle?: string;
  comments: MediaReviewComment[];
  durationMs?: number;
  onActiveCommentChange?: (comment: MediaReviewComment | null) => void;
  onSeek?: (timeMs: number) => void;
  className?: string;
  timelineHeight?: number;
  pronunciationCatalog?: PronunciationReviewCatalog | null;
}
