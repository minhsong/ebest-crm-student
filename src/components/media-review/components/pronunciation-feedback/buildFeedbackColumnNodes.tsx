'use client';

import type { ReactNode } from 'react';
import { Tag, Typography } from 'antd';
import type { MediaReviewComment, PronunciationReviewCatalog } from '../../types';
import {
  buildCatalogMaps,
  formatIntonationArrows,
  getFinalSoundDisplayLabel,
  getIpaDisplayLabel,
} from '../../pronunciation-utils';
import { INTONATION_ARROW_COLOR } from '../../media-review-styles';
import { FeedbackColumn } from './FeedbackColumn';

const { Text } = Typography;

const TAG_STACK_STYLE = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
  alignItems: 'flex-start' as const,
};

/** Cột card theo thứ tự: IPA → Liaison → Âm cuối → Stress → Intonation. */
export function buildFeedbackColumnNodes(
  comment: MediaReviewComment,
  catalog: PronunciationReviewCatalog | null,
): ReactNode[] {
  const maps = buildCatalogMaps(catalog);
  const columns: ReactNode[] = [];

  if ((comment.ipa?.length ?? 0) > 0) {
    columns.push(
      <FeedbackColumn key="ipa" title="IPA">
        <div style={TAG_STACK_STYLE}>
          {comment.ipa!.map((code) => {
            const item = maps.ipa.get(code);
            return (
              <Tag key={code} color="blue" style={{ margin: 0 }}>
                {getIpaDisplayLabel(item, code)}
              </Tag>
            );
          })}
        </div>
      </FeedbackColumn>,
    );
  }

  if ((comment.liaison?.items?.length ?? 0) > 0) {
    columns.push(
      <FeedbackColumn key="liaison" title="Liaison">
        {comment.liaison!.items.map((item, i) => (
          <div key={i}>
            <Text style={{ fontSize: 13, display: 'block' }}>
              {item.word1}
              <Text type="secondary"> ⟷ </Text>
              {item.word2}
            </Text>
            {item.linkSound ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({getFinalSoundDisplayLabel(
                  maps.finalSounds.get(item.linkSound),
                  item.linkSound,
                )})
              </Text>
            ) : null}
          </div>
        ))}
      </FeedbackColumn>,
    );
  }

  if ((comment.finalSounds?.length ?? 0) > 0) {
    columns.push(
      <FeedbackColumn key="final" title="Âm cuối">
        <div style={TAG_STACK_STYLE}>
          {comment.finalSounds!.map((code) => {
            const item = maps.finalSounds.get(code);
            return (
              <Tag key={code} color="geekblue" style={{ margin: 0 }}>
                {getFinalSoundDisplayLabel(item, code)}
              </Tag>
            );
          })}
        </div>
      </FeedbackColumn>,
    );
  }

  if ((comment.stress?.items?.length ?? 0) > 0) {
    columns.push(
      <FeedbackColumn key="stress" title="Stress">
        {comment.stress!.items.map((item, i) => (
          <Text key={i} style={{ display: 'block', fontSize: 13 }}>
            {item.word}
            <Text type="secondary"> — </Text>
            <Text strong>{item.stressedSyllable}</Text>
          </Text>
        ))}
      </FeedbackColumn>,
    );
  }

  if ((comment.intonation?.items?.length ?? 0) > 0) {
    columns.push(
      <FeedbackColumn key="intonation" title="Intonation">
        {comment.intonation!.items.map((item, i) => (
          <div key={i}>
            <Text style={{ fontSize: 13, display: 'block' }}>{item.text}</Text>
            {item.arrows?.length ? (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: 2,
                  color: INTONATION_ARROW_COLOR,
                }}
              >
                {formatIntonationArrows(item.arrows)}
              </Text>
            ) : null}
          </div>
        ))}
      </FeedbackColumn>,
    );
  }

  return columns;
}
