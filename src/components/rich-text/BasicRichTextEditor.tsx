'use client';

import './BasicRichTextEditor.css';

import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  BoldOutlined,
  BorderLeftOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, Divider, message, Space, Tooltip, theme } from 'antd';
import { useEffect, useRef } from 'react';

/* eslint-disable no-alert */

export type BasicRichTextEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  disablePaste?: boolean;
  pasteBlockedMessage?: string;
  minHeight?: number;
};

/**
 * TipTap editor cơ bản (in đậm / list / link) — bài viết HV, không ảnh/YouTube.
 */
export function BasicRichTextEditor({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung…',
  disabled,
  readOnly = false,
  disablePaste = false,
  pasteBlockedMessage = 'Không được dán từ clipboard — vui lòng tự gõ.',
  minHeight = 220,
}: BasicRichTextEditorProps) {
  const { token } = theme.useToken();
  const locked = Boolean(disabled || readOnly);
  const pendingLocalHtml = useRef<string | null>(null);
  const disablePasteRef = useRef(disablePaste);
  const pasteBlockedMessageRef = useRef(pasteBlockedMessage);

  useEffect(() => {
    disablePasteRef.current = disablePaste;
  }, [disablePaste]);

  useEffect(() => {
    pasteBlockedMessageRef.current = pasteBlockedMessage;
  }, [pasteBlockedMessage]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editable: !locked,
    editorProps: {
      handlePaste: (_view, event) => {
        if (!disablePasteRef.current) return false;
        event.preventDefault();
        message.warning(pasteBlockedMessageRef.current);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      pendingLocalHtml.current = html;
      onChange?.(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (
      pendingLocalHtml.current !== null &&
      value === pendingLocalHtml.current
    ) {
      pendingLocalHtml.current = null;
      return;
    }
    const cur = editor.getHTML();
    if (value !== cur) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    pendingLocalHtml.current = null;
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!locked);
  }, [locked, editor]);

  useEditorState({
    editor,
    selector: (snap) => snap.transactionNumber,
  });

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL liên kết', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  const rootStyle = {
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    background: token.colorBgContainer,
    ['--basic-editor-min-height' as string]: `${minHeight}px`,
  };

  if (readOnly) {
    return (
      <div className="basic-rich-text-editor basic-rich-text-editor--readonly" style={rootStyle}>
        <EditorContent editor={editor} className="basic-rich-text-editor__content" />
      </div>
    );
  }

  return (
    <div className="basic-rich-text-editor" style={rootStyle}>
      <Space
        wrap
        size={[4, 8]}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Tooltip title="Đậm">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()}
            style={editor.isActive('bold') ? { color: token.colorPrimary } : undefined}
          />
        </Tooltip>
        <Tooltip title="Nghiêng">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<ItalicOutlined />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            style={editor.isActive('italic') ? { color: token.colorPrimary } : undefined}
          />
        </Tooltip>
        <Tooltip title="Gạch chân">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<UnderlineOutlined />}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            style={
              editor.isActive('underline') ? { color: token.colorPrimary } : undefined
            }
          />
        </Tooltip>
        <Tooltip title="Gạch ngang">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<StrikethroughOutlined />}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            style={editor.isActive('strike') ? { color: token.colorPrimary } : undefined}
          />
        </Tooltip>
        <Divider type="vertical" style={{ height: 20, margin: '0 2px' }} />
        <Tooltip title="Tiêu đề cấp 2">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            style={
              editor.isActive('heading', { level: 2 })
                ? { color: token.colorPrimary, fontWeight: 600 }
                : { fontSize: 12 }
            }
          >
            H2
          </Button>
        </Tooltip>
        <Tooltip title="Tiêu đề cấp 3">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            style={
              editor.isActive('heading', { level: 3 })
                ? { color: token.colorPrimary, fontWeight: 600 }
                : { fontSize: 12 }
            }
          >
            H3
          </Button>
        </Tooltip>
        <Tooltip title="Trích dẫn">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<BorderLeftOutlined />}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            style={
              editor.isActive('blockquote') ? { color: token.colorPrimary } : undefined
            }
          />
        </Tooltip>
        <Divider type="vertical" style={{ height: 20, margin: '0 2px' }} />
        <Tooltip title="Danh sách bullet">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<UnorderedListOutlined />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
        </Tooltip>
        <Tooltip title="Danh sách số">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<OrderedListOutlined />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </Tooltip>
        <Tooltip title="Chèn liên kết">
          <Button
            type="text"
            size="small"
            disabled={disabled}
            icon={<LinkOutlined />}
            onClick={setLink}
          />
        </Tooltip>
      </Space>
      <EditorContent editor={editor} className="basic-rich-text-editor__content" />
    </div>
  );
}
