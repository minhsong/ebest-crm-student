/**
 * Hiển thị đồng nhất nhãn đáp án MCQ: chữ A/B/C + nội dung HTML từ snapshot CRM (label/text).
 */

export function QuizMcqOptionLabel({
  letter,
  html,
}: {
  letter: string;
  html: string;
}) {
  return (
    <span className="flex items-start gap-2">
      <span className="min-w-[1.5rem] shrink-0 pt-px font-semibold text-neutral-800">
        {letter}.
      </span>
      {/* eslint-disable-next-line react/no-danger */}
      <span className="inline-block [&_p]:my-1" dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  );
}
