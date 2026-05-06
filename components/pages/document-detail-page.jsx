"use client";

import { useEffect, useState } from "react";
import { FeaturePage } from "@/components/pages/feature-page";
import { RichDocumentEditor } from "@/components/document/rich-document-editor";

export function DocumentDetailPage({ documentId }) {
  const [state, setState] = useState({ status: "loading", document: null, error: "" });
  const [editorState, setEditorState] = useState({
    html: "",
    text: "",
    originalHtml: "",
    originalText: "",
  });
  const [saveState, setSaveState] = useState({ status: "idle", error: "", message: "" });

  useEffect(() => {
    let active = true;

    async function load() {
      const token = window.localStorage.getItem("smartreview-token");
      try {
        const response = await fetch(`/api/v1/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Unable to load document");
        if (active) {
          const fallbackHtml = textToStructuredHtml(payload.text || payload.textPreview || "");
          const html = payload.contentHtml || fallbackHtml;
          const text = payload.text || payload.textPreview || "";
          setState({ status: "idle", document: payload, error: "" });
          setEditorState({
            html,
            text,
            originalHtml: html,
            originalText: text,
          });
          setSaveState({ status: "idle", error: "", message: "" });
        }
      } catch (error) {
        if (active) setState({ status: "idle", document: null, error: error.message });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [documentId]);

  async function handleSave() {
    if (!state.document) return;

    const token = window.localStorage.getItem("smartreview-token");
    setSaveState({ status: "saving", error: "", message: "" });
    try {
      const response = await fetch(`/api/v1/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: editorState.html,
          text: editorState.text,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to save document");
      const savedHtml = payload.contentHtml || editorState.html;
      const savedText = payload.text || editorState.text;
      setState({ status: "idle", document: payload, error: "" });
      setEditorState({
        html: savedHtml,
        text: savedText,
        originalHtml: savedHtml,
        originalText: savedText,
      });
      setSaveState({ status: "idle", error: "", message: "Saved" });
    } catch (error) {
      setSaveState({ status: "idle", error: error.message, message: "" });
    }
  }

  const hasChanges =
    normalizeHtml(editorState.html) !== normalizeHtml(editorState.originalHtml) ||
    normalizeText(editorState.text) !== normalizeText(editorState.originalText);

  return (
    <FeaturePage
      title="Document Editor"
      description="Edit the document in a Word-like rich text surface."
      primaryHref="/documents"
      primaryLabel="Back to Documents"
    >
      {state.status === "loading" && <section className="panel"><p>Loading document...</p></section>}
      {state.error && <section className="panel"><p className="error-text">{state.error}</p></section>}
      {state.document && (
        <section className="document-editor-grid">
          <div className="panel document-meta-bar">
            <div>
              <h2>{state.document.fileName}</h2>
              <p>
                {state.document.structure?.wordCount || 0} words
                {" - "}
                {fileTypeLabel(state.document.mime)}
                {" - "}
                {formatBytes(state.document.size)}
                {" - "}
                Uploaded {formatDateTime(state.document.createdAt)}
              </p>
            </div>
            <div className="document-editor-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setEditorState((current) => ({
                  ...current,
                  html: current.originalHtml,
                  text: current.originalText,
                }))}
                disabled={!hasChanges}
              >
                Reset
              </button>
              <button
                type="button"
                className="primary-link"
                onClick={handleSave}
                disabled={!hasChanges || saveState.status === "saving"}
              >
                {saveState.status === "saving" ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {saveState.message && <p className="success-text">{saveState.message}</p>}
          {saveState.error && <p className="error-text">{saveState.error}</p>}

          <RichDocumentEditor
            content={editorState.html}
            onChange={({ html, text }) => {
              setEditorState((current) => ({
                ...current,
                html,
                text,
              }));
            }}
          />
        </section>
      )}
    </FeaturePage>
  );
}

function textToStructuredHtml(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "<p></p>";
  }

  return clean
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(mime) {
  const mapping = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "text/plain": "TXT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  };
  return mapping[mime] || "FILE";
}
