'use client';

import type { QuizPublishedFormPayload, QuizFormSectionPayload } from '@/features/quiz-test/types';
import {
  filterRenderableBlocksBySectionId,
  type QuizRenderableBlock,
} from '@/features/quiz-test/lib/quiz-renderable-items';
import { buildBlockStartIndexes } from '@/features/quiz-test/lib/quiz-runtime-view';
import {
  findQuizFormSection,
  resolveQuizSectionNavMeta,
  sortQuizFormSections,
} from '@/features/quiz-test/lib/quiz-section-meta';
import { Button, Drawer, Typography } from 'antd';
import { useMemo } from 'react';

function blockOutlineLabel(block: QuizRenderableBlock, displayFrom: number): string {
  if (block.kind === 'single') {
    return `Câu ${displayFrom + 1}`;
  }
  const n = block.items.length;
  const last = displayFrom + n;
  return n <= 1 ? `Câu ${displayFrom + 1} (nhóm)` : `Câu ${displayFrom + 1}–${last} (nhóm)`;
}

function blockKey(b: QuizRenderableBlock): string {
  if (b.kind === 'single') return `s:${String(b.item.formItemId)}`;
  return `b:${b.bundleKey}`;
}

export type QuizSectionOutlineDrawerProps = {
  open: boolean;
  onClose: () => void;
  formPayload: QuizPublishedFormPayload;
  allRenderBlocks: QuizRenderableBlock[];
  activeSectionId: number | null;
  /** Key thô (formItemId / parent bundle) khớp query `question`. */
  activeAnchorKey?: string | null;
  onNavigateToBlock: (sectionId: number | null, anchorRawKey: string) => void;
  /** Khi true, không cho nhảy sang phần khác (vẫn cho phép cùng phần). */
  navigationLocked?: boolean;
  /** Phần đang làm — dùng với `navigationLocked`. */
  lockedSectionId?: number | null;
};

/**
 * Drawer mục lục §11.4: section → block (câu đơn / nhóm).
 */
export function QuizSectionOutlineDrawer({
  open,
  onClose,
  formPayload,
  allRenderBlocks,
  activeSectionId,
  activeAnchorKey,
  onNavigateToBlock,
  navigationLocked,
  lockedSectionId,
}: QuizSectionOutlineDrawerProps) {
  const sections = useMemo(
    () => sortQuizFormSections(formPayload?.sections),
    [formPayload?.sections],
  );

  const starts = useMemo(() => buildBlockStartIndexes(allRenderBlocks), [allRenderBlocks]);

  const rows = useMemo(() => {
    const out: Array<{
      sectionId: number | null;
      sectionTitle: string;
      anchorKey: string;
      label: string;
    }> = [];

    const pushBlocks = (sectionId: number | null, blocks: QuizRenderableBlock[]) => {
      for (const b of blocks) {
        const gi = allRenderBlocks.findIndex((x) => blockKey(x) === blockKey(b));
        const startIdx = gi >= 0 ? (starts[gi] ?? 0) : 0;
        const anchorKey =
          b.kind === 'single' ? String(b.item.formItemId) : String(b.parentFormItemId);
        const secMeta = findQuizFormSection(sections, sectionId);
        const { idx: sectionIdx } = resolveQuizSectionNavMeta(sections, sectionId);
        const secTitle =
          sectionId == null
            ? 'Toàn bài'
            : secMeta?.title?.trim() ||
              `Phần ${sectionIdx >= 0 ? sectionIdx + 1 : 1}`;
        out.push({
          sectionId,
          sectionTitle: secTitle,
          anchorKey,
          label: blockOutlineLabel(b, startIdx),
        });
      }
    };

    if (!sections.length) {
      pushBlocks(null, allRenderBlocks);
      return out;
    }

    for (const sec of sections) {
      const sid = Number(sec.sectionId);
      const blocks = filterRenderableBlocksBySectionId(formPayload, allRenderBlocks, sid);
      pushBlocks(Number.isFinite(sid) ? sid : null, blocks);
    }
    return out;
  }, [allRenderBlocks, formPayload, sections, starts]);

  return (
    <Drawer title="Mục lục phần / câu" placement="right" width={320} onClose={onClose} open={open}>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={`${r.sectionId ?? 'all'}-${r.anchorKey}`} className="flex flex-col gap-0.5">
            <Typography.Text type="secondary" className="text-xs">
              {r.sectionTitle}
            </Typography.Text>
            <Button
              type={
                r.anchorKey === activeAnchorKey &&
                (r.sectionId ?? null) === (activeSectionId ?? null)
                  ? 'link'
                  : 'text'
              }
              disabled={
                !!navigationLocked &&
                (r.sectionId ?? null) !== (lockedSectionId ?? null)
              }
              className="!h-auto !justify-start !px-0 !py-1 text-left"
              onClick={() => {
                if (
                  navigationLocked &&
                  (r.sectionId ?? null) !== (lockedSectionId ?? null)
                ) {
                  return;
                }
                onNavigateToBlock(r.sectionId, r.anchorKey);
              }}
            >
              {r.label}
            </Button>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
