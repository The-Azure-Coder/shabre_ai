"use client";

import { useEffect, useMemo, useState } from "react";
import { Node } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Icon } from "@/lib/icons";

const APA_PRESET = {
  preset: "APA",
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "12px",
  lineHeight: "2",
  paragraphGap: "0.5rem",
  pagePaddingX: "1in",
  pagePaddingY: "1in",
  pageWidth: "8.5in",
  pageMinHeight: "11in",
};

const CUSTOM_PRESET = {
  preset: "Custom",
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: "12px",
  lineHeight: "1.5",
  paragraphGap: "0.75rem",
  pagePaddingX: "0.9in",
  pagePaddingY: "0.9in",
  pageWidth: "8.5in",
  pageMinHeight: "11in",
};

const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: "div[data-page-break]" }];
  },
  renderHTML() {
    return [
      "div",
      { "data-page-break": "true", class: "page-break" },
      ["span", { class: "page-break__label" }, "Page Break"],
    ];
  },
  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).run(),
    };
  },
});

export function RichDocumentEditor({ content, onChange }) {
  const [formatting, setFormatting] = useState(APA_PRESET);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: "Start typing your document...",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      PageBreak,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: content || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "editor-content editor-content-rich rich-document-editor__content",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange?.({
        html: instance.getHTML(),
        text: instance.getText(),
      });
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextContent = content || "<p></p>";
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <section className="panel rich-document-editor__shell">
        <p>Loading editor...</p>
      </section>
    );
  }

  const insertLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL", previousUrl);

    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertPageBreak = () => {
    editor.chain().focus().insertPageBreak().run();
  };

  const applyPreset = (value) => {
    if (value === "APA") {
      setFormatting(APA_PRESET);
      return;
    }

    setFormatting(CUSTOM_PRESET);
  };

  const style = {
    "--doc-font-family": formatting.fontFamily,
    "--doc-font-size": formatting.fontSize,
    "--doc-line-height": formatting.lineHeight,
    "--doc-paragraph-gap": formatting.paragraphGap,
    "--doc-page-padding-x": formatting.pagePaddingX,
    "--doc-page-padding-y": formatting.pagePaddingY,
    "--doc-page-width": formatting.pageWidth,
    "--doc-page-min-height": formatting.pageMinHeight,
  };

  return (
    <section className="panel rich-document-editor__shell" style={style}>
      <div className="editor-toolbar rich-document-editor__toolbar">
        <div className="toolbar-group">
          <label className="toolbar-label" htmlFor="formatting-preset">
            Preset
          </label>
          <select
            id="formatting-preset"
            className="toolbar-select"
            value={formatting.preset}
            onChange={(event) => applyPreset(event.target.value)}
          >
            <option value="APA">APA</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <label className="toolbar-label" htmlFor="font-family">
            Font
          </label>
          <select
            id="font-family"
            className="toolbar-select"
            value={formatting.fontFamily}
            onChange={(event) =>
              setFormatting((current) => ({
                ...current,
                preset: "Custom",
                fontFamily: event.target.value,
              }))
            }
          >
            <option value='"Times New Roman", Times, serif'>Times New Roman</option>
            <option value='Arial, Helvetica, sans-serif'>Arial</option>
            <option value='"Georgia", serif'>Georgia</option>
          </select>

          <label className="toolbar-label" htmlFor="font-size">
            Size
          </label>
          <select
            id="font-size"
            className="toolbar-select toolbar-select--compact"
            value={formatting.fontSize}
            onChange={(event) =>
              setFormatting((current) => ({
                ...current,
                preset: "Custom",
                fontSize: event.target.value,
              }))
            }
          >
            <option value="11px">11</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
          </select>

          <label className="toolbar-label" htmlFor="line-height">
            Spacing
          </label>
          <select
            id="line-height"
            className="toolbar-select toolbar-select--compact"
            value={formatting.lineHeight}
            onChange={(event) =>
              setFormatting((current) => ({
                ...current,
                preset: "Custom",
                lineHeight: event.target.value,
              }))
            }
          >
            <option value="1.5">1.5</option>
            <option value="2">2.0</option>
          </select>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <label className="toolbar-label" htmlFor="margin">
            Margins
          </label>
          <select
            id="margin"
            className="toolbar-select"
            value={formatting.pagePaddingX}
            onChange={(event) =>
              setFormatting((current) => ({
                ...current,
                preset: "Custom",
                pagePaddingX: event.target.value,
                pagePaddingY: event.target.value,
              }))
            }
          >
            <option value="1in">1 in</option>
            <option value="0.9in">0.9 in</option>
            <option value="0.75in">0.75 in</option>
          </select>

          <label className="toolbar-label" htmlFor="paragraph-gap">
            Paragraph
          </label>
          <select
            id="paragraph-gap"
            className="toolbar-select toolbar-select--compact"
            value={formatting.paragraphGap}
            onChange={(event) =>
              setFormatting((current) => ({
                ...current,
                preset: "Custom",
                paragraphGap: event.target.value,
              }))
            }
          >
            <option value="0.25rem">Tight</option>
            <option value="0.5rem">APA</option>
            <option value="0.75rem">Loose</option>
          </select>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Icon name="repeat" style={{ transform: "scaleX(-1)" }} />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Icon name="repeat" />
          </ToolbarButton>
          <ToolbarButton title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")}>
            P
          </ToolbarButton>
          <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
            H1
          </ToolbarButton>
          <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
            H2
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
            <span style={{ textDecoration: "underline" }}>U</span>
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
            <span style={{ textDecoration: "line-through" }}>S</span>
          </ToolbarButton>
          <ToolbarButton title="Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}>
            {"</>"}
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
            •
          </ToolbarButton>
          <ToolbarButton title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
            1.
          </ToolbarButton>
          <ToolbarButton title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
            &ldquo;
          </ToolbarButton>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <ToolbarButton title="Insert Link" onClick={insertLink} active={editor.isActive("link")}>
            Link
          </ToolbarButton>
          <ToolbarButton title="Insert Page Break" onClick={insertPageBreak}>
            Break
          </ToolbarButton>
          <ToolbarButton
            title="Insert Table"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            Table
          </ToolbarButton>
          <ToolbarButton title="Delete Table" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.isActive("table")}>
            Del Table
          </ToolbarButton>
        </div>
      </div>

      <div className="editor-paper rich-document-editor__paper">
        <div className="rich-document-editor__page-frame">
          <EditorContent editor={editor} />
        </div>
      </div>
    </section>
  );
}

function ToolbarButton({ active = false, disabled = false, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={active ? "is-active" : ""}
    >
      {children}
    </button>
  );
}
