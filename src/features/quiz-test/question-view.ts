/**
 * Tiêu đề câu chỉ hiển thị thứ tự + (mã câu) cho học viên — không expose `formItemId` hay id nội bộ.
 */
export function formatQuizQuestionHeading(
  row: {
    order?: number;
    formItemId: number | string;
    questionSnapshot?: null | {
      code?: string | null;
      id?: number;
    };
  },
  zeroBasedIndex: number,
): string {
  const n =
    typeof row.order === 'number' && Number.isFinite(row.order)
      ? row.order
      : zeroBasedIndex + 1;
  const q = row.questionSnapshot;
  const code =
    q != null &&
    typeof q.code === 'string' &&
    q.code.trim()
      ? q.code.trim()
      : '';
  return code ? `Câu ${n} (${code})` : `Câu ${n}`;
}

export function isMultipleChoiceQuestion(
  questionType: string | null | undefined,
): boolean {
  const s = String(questionType ?? '').toLowerCase();
  return s.includes('multiple');
}

export function getQuizOptionsFromSnapshot(
  content: Record<string, unknown> | undefined,
): Array<{ id: string; html: string }> {
  const raw = content?.options;
  if (!Array.isArray(raw)) return [];
  return raw.map((o: unknown, idx: number) => {
    const r = typeof o === 'object' && o ? (o as Record<string, unknown>) : {};
    const id =
      r.id !== undefined && r.id !== null
        ? String(r.id)
        : typeof r.optionId !== 'undefined'
          ? String(r.optionId)
          : `opt_${idx}`;
    /**
     * CRM options thường có:
     * - `label`: ký hiệu ngắn (A/B/C/D)
     * - `text`: nội dung đầy đủ cần hiển thị cho học viên
     * Ưu tiên `text` để không bị render thành "A, B, C, D" ở UI kết quả.
     */
    const text =
      typeof r.text === 'string' && r.text.trim() ? r.text : null;
    const label =
      typeof r.label === 'string' && r.label.trim() ? r.label : null;
    const htmlCandidate = text ?? label ?? `<span>#${idx + 1}</span>`;
    return { id, html: htmlCandidate };
  });
}

export function normalizeSelectedOptionIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value == null || value === '') return [];
  return [String(value)];
}

/** Giá trị cho MCQ một đáp án — dùng chung làm/thiết bị đọc. */
export function normalizeMcqSingleValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;
  const ids = normalizeSelectedOptionIds(value);
  return ids.length ? ids[0] : undefined;
}

/** Giá trị cho MCQ nhiều đáp án — `undefined` khi chưa chọn gì (Ant Group). */
export function normalizeMcqMultipleValue(value: unknown): string[] | undefined {
  const ids = normalizeSelectedOptionIds(value);
  return ids.length ? ids : undefined;
}

/** A, B, … Z, AA, … giống cột Excel (index 0-based). */
export function optionDisplayLetter(indexZeroBased: number): string {
  let n = indexZeroBased;
  let out = '';
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out || 'A';
}

/**
 * Theo `QuizFormItemPayload.optionOrder` (nếu CRM gửi) để khớp thứ tự preview.
 */
export function orderQuizOptionsByFormItem(
  options: Array<{ id: string; html: string }>,
  optionOrder?: string[] | null,
): Array<{ id: string; html: string }> {
  if (!Array.isArray(optionOrder) || optionOrder.length === 0) {
    return options;
  }
  const pos = new Map(optionOrder.map((id, i) => [String(id), i]));
  return [...options].sort((a, b) => {
    const ia = pos.has(a.id) ? (pos.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const ib = pos.has(b.id) ? (pos.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return 0;
  });
}

