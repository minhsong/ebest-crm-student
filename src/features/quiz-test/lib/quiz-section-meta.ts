import type { QuizFormSectionPayload } from '@/features/quiz-test/types';

/** Section theo `order` — dùng thống nhất nav / heading / footer / outline. */
export function sortQuizFormSections(
  sections: QuizFormSectionPayload[] | null | undefined,
): QuizFormSectionPayload[] {
  if (!sections?.length) return [];
  return [...sections].sort((a, b) => a.order - b.order);
}

export type QuizSectionNavMeta = {
  sorted: QuizFormSectionPayload[];
  idx: number;
  multiSection: boolean;
  isFirst: boolean;
  isLast: boolean;
  active: QuizFormSectionPayload | null;
};

/** Meta nav phần (index, first/last) — footer, outline, v.v. */
export function resolveQuizSectionNavMeta(
  sections: QuizFormSectionPayload[] | null | undefined,
  activeSectionId: number | null | undefined,
): QuizSectionNavMeta {
  const sorted = sortQuizFormSections(sections);
  const idx =
    sorted.length && typeof activeSectionId === 'number'
      ? sorted.findIndex((s) => s.sectionId === activeSectionId)
      : -1;

  return {
    sorted,
    idx,
    multiSection: sorted.length > 1 && idx >= 0,
    isFirst: idx <= 0,
    isLast: idx >= 0 && idx === sorted.length - 1,
    active: idx >= 0 ? sorted[idx]! : null,
  };
}

export function findQuizFormSection(
  sections: QuizFormSectionPayload[] | null | undefined,
  sectionId: number | null | undefined,
): QuizFormSectionPayload | null {
  if (sectionId == null || !Number.isFinite(sectionId) || !sections?.length) {
    return null;
  }
  return sections.find((s) => s.sectionId === sectionId) ?? null;
}

/** Heading Alert hướng dẫn — «Phần i/n: title» hoặc chỉ title. */
export function formatSectionInstructionsHeading(
  sections: QuizFormSectionPayload[] | null | undefined,
  activeSectionId: number | null | undefined,
): string | null {
  const { sorted, idx, active } = resolveQuizSectionNavMeta(sections, activeSectionId);
  if (!sorted.length) return null;

  if (sorted.length <= 1) {
    return sorted[0]?.title?.trim() || null;
  }

  if (idx < 0 || !active) return null;

  const title = active.title?.trim();
  const prefix = `Phần ${idx + 1}/${sorted.length}`;
  return title ? `${prefix}: ${title}` : prefix;
}

export function getAdjacentSectionId(
  sections: QuizFormSectionPayload[] | null | undefined,
  activeSectionId: number,
  direction: 'prev' | 'next',
): number | null {
  const { sorted, idx } = resolveQuizSectionNavMeta(sections, activeSectionId);
  if (idx < 0) return null;
  const target = direction === 'prev' ? sorted[idx - 1] : sorted[idx + 1];
  return target?.sectionId ?? null;
}
