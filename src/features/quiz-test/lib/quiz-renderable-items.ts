import type {
  QuizFormItemPayload,
  QuizGroupBundlePayload,
  QuizPublishedFormPayload,
} from '@/features/quiz-test/types';

/** Key ổn định cho câu con trong bundle để lưu answers + grading đồng nhất với backend. */
export function buildBundleChildFormItemKey(
  parentFormItemId: string | number,
  childQuestionId: string | number,
): string {
  return `${String(parentFormItemId)}::${String(childQuestionId)}`;
}

export type QuizRenderableBlock =
  | {
      kind: 'single';
      item: QuizFormItemPayload;
    }
  | {
      kind: 'bundle';
      bundleKey: string;
      sourceGroupId: number;
      stemHtml: string | null;
      items: QuizFormItemPayload[];
    };

/**
 * Expand `items` cho UI:
 * - item thường: giữ nguyên
 * - item là bundle (questionSnapshot null + sourceGroupId): nở thành nhiều câu con từ `groupBundles.children`
 */
export function expandRenderableQuizItems(
  formPayload: QuizPublishedFormPayload | null | undefined,
): QuizFormItemPayload[] {
  return buildQuizRenderableBlocks(formPayload).flatMap((b) =>
    b.kind === 'single' ? [b.item] : b.items,
  );
}

export function buildQuizRenderableBlocks(
  formPayload: QuizPublishedFormPayload | null | undefined,
): QuizRenderableBlock[] {
  const rawItems = Array.isArray(formPayload?.items) ? formPayload.items : [];
  const bundles = Array.isArray(formPayload?.groupBundles)
    ? (formPayload.groupBundles as QuizGroupBundlePayload[])
    : [];
  const bundleByGroupId = new Map<number, QuizGroupBundlePayload>();
  for (const g of bundles) {
    if (!g || typeof g !== 'object') continue;
    const gid = Number(g.sourceGroupId);
    if (!Number.isFinite(gid)) continue;
    bundleByGroupId.set(gid, g);
  }

  const out: QuizRenderableBlock[] = [];
  for (const item of rawItems) {
    const q = item.questionSnapshot;
    if (q) {
      out.push({ kind: 'single', item });
      continue;
    }
    const gid = Number(item.sourceGroupId);
    if (!Number.isFinite(gid)) continue;
    const group = bundleByGroupId.get(gid);
    const children = Array.isArray(group?.children) ? group!.children! : [];
    if (!children.length) continue;
    const bundleItems: QuizFormItemPayload[] = [];
    for (const child of children) {
      if (!child || typeof child !== 'object') continue;
      const childId = Number(child.id);
      if (!Number.isFinite(childId)) continue;
      bundleItems.push({
        formItemId: buildBundleChildFormItemKey(item.formItemId, childId),
        order: undefined,
        sourceQuestionId: childId,
        sourceGroupId: gid,
        optionOrder: null,
        questionSnapshot: {
          id: childId,
          code: typeof child.code === 'string' ? child.code : null,
          questionType:
            typeof child.questionType === 'string' ? child.questionType : null,
          content:
            child.content && typeof child.content === 'object'
              ? (child.content as Record<string, unknown>)
              : undefined,
          taxonomyRefs:
            child.taxonomyRefs && typeof child.taxonomyRefs === 'object'
              ? child.taxonomyRefs
              : null,
        },
      });
    }
    if (bundleItems.length > 0) {
      const content =
        group?.bundleSnapshot?.content &&
        typeof group.bundleSnapshot.content === 'object'
          ? (group.bundleSnapshot.content as Record<string, unknown>)
          : null;
      const stemHtml =
        typeof content?.stem === 'string' ? content.stem : null;
      out.push({
        kind: 'bundle',
        bundleKey: `bundle:${String(item.formItemId)}:${String(gid)}`,
        sourceGroupId: gid,
        stemHtml,
        items: bundleItems,
      });
    }
  }
  return out;
}

