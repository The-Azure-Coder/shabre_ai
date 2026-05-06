"use client";

import { Icon } from "@/lib/icons";

export function DocumentPreview({
  document,
  compact = false,
  showToolbar = true,
  title = "Document Preview",
  suggestions = [],
}) {
  if (!document) return null;

  const html = annotateSuggestions(
    document.contentHtml || textToHtml(document.text || document.textPreview || ""),
    suggestions,
  );

  return (
    <div className={`document-preview${compact ? " document-preview-compact" : ""}`}>
      {showToolbar ? (
        <div className="editor-toolbar editor-toolbar-preview" aria-hidden="true">
          <div className="toolbar-group">
            <button type="button" title="Undo"><Icon name="repeat" style={{ transform: "scaleX(-1)" }} /></button>
            <button type="button" title="Redo"><Icon name="repeat" /></button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <strong>Normal text</strong>
            <Icon name="chevron-down" />
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button type="button" title="Bold" style={{ fontWeight: "bold" }}>B</button>
            <button type="button" title="Italic" style={{ fontStyle: "italic" }}>I</button>
            <button type="button" title="Underline" style={{ textDecoration: "underline" }}>U</button>
          </div>
        </div>
      ) : null}
      <div className="editor-paper">
        <div className="document-preview-header">
          <div>
            <h2>{document.fileName || title}</h2>
            {document.structure?.title ? <p>{document.structure.title}</p> : null}
          </div>
          {document.structure ? (
            <div className="document-preview-meta">
              <span>{document.structure.wordCount || 0} words</span>
              <span>{document.structure.paragraphCount || 0} paragraphs</span>
            </div>
          ) : null}
        </div>
        <div
          className={`editor-content${document.contentHtml ? " editor-content-rich" : " editor-content-plain"}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

function textToHtml(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return '<p class="document-placeholder">No preview available.</p>';
  }

  const blocks = raw.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const html = blocks.map((block, index) => {
    const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
    const isHeading = index === 0 || (lines.length === 1 && lines[0].length < 90 && !/[.!?]$/.test(lines[0]));
    if (isHeading) {
      return `<h2>${escapeInline(lines.join(" "))}</h2>`;
    }
    const bulletLines = lines.every((line) => /^([-*\u2022]|\d+\.)\s+/.test(line));
    if (bulletLines) {
      const items = lines.map((line) => `<li>${escapeInline(line.replace(/^([-*\u2022]|\d+\.)\s+/, ""))}</li>`).join("");
      return `<ul>${items}</ul>`;
    }
    return lines.map((line) => `<p>${escapeInline(line)}</p>`).join("");
  }).join("");

  return html || `<p>${escapeInline(raw)}</p>`;
}

function escapeInline(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function annotateSuggestions(html, suggestions) {
  const items = Array.isArray(suggestions) ? suggestions : [];
  if (!items.length) return html;

  const byParagraph = new Map();
  for (const item of items) {
    const index = Number(item?.location?.paragraph);
    if (!Number.isInteger(index) || index < 1) continue;
    const current = byParagraph.get(index) || [];
    current.push(item);
    byParagraph.set(index, current);
  }

  let blockIndex = 0;
  return String(html).replace(/<(p|h1|h2|h3|h4|h5|h6|li)(\b[^>]*)?>/gi, (match, tag, attrs = "") => {
    blockIndex += 1;
    const matches = byParagraph.get(blockIndex);
    if (!matches?.length) return match;

    const classes = [
      "review-highlight",
      ...matches.map((item) => `review-highlight--${item.type}`),
      ...matches.map((item) => `review-highlight--${item.severity}`),
    ];
    const title = matches
      .map((item) => `${label(item.type)}: ${item.reason}`)
      .join(" | ")
      .replaceAll('"', "&quot;");

    const existing = attrs.match(/class="([^"]*)"/i)?.[1] || "";
    const classAttr = `${existing} ${classes.join(" ")}`.trim();
    const attrsWithoutClass = attrs.replace(/\sclass="[^"]*"/i, "");
    return `<${tag}${attrsWithoutClass} class="${classAttr}" data-suggestion-title="${title}">`;
  });
}

function label(value) {
  return String(value || "")
    .charAt(0)
    .toUpperCase() + String(value || "").slice(1);
}
