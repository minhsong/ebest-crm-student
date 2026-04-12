'use client';

import './qa-tiptap-content.css';

type QaArticleHtmlProps = {
  html: string;
};

/**
 * HTML từ CRM TipTap (`QaRichTextEditor` / `getHTML()`).
 * Bọc `.tiptap` trong `.qa-content` để áp dụng cùng chuẩn style với editor.
 */
export function QaArticleHtml({ html }: QaArticleHtmlProps) {
  return (
    <article className="qa-article">
      <div className="qa-content max-w-none text-gray-900">
        <div
          className="tiptap"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </article>
  );
}
