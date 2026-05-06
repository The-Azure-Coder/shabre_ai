"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { UniversalLoader } from "@/components/layout/universal-loader";
import { Button } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/surfaces";
import { Icon } from "@/lib/icons";
import { validateUploadFile } from "@/lib/upload-constraints";

const FORMAT_OPTIONS = [
  { id: "APA", title: "APA", subtitle: "American Psychological Association" },
  { id: "MLA", title: "MLA", subtitle: "Modern Language Association" },
  { id: "Chicago", title: "Chicago", subtitle: "Chicago Manual" },
  { id: "Harvard", title: "Harvard", subtitle: "Harvard Referencing Style" },
];

const STEPS = [
  { number: 1, title: "Select Format", subtitle: "Choose a formatting style" },
  { number: 2, title: "Choose Document", subtitle: "Select or upload your file" },
  { number: 3, title: "AI Reformat", subtitle: "Generate the updated version" },
  { number: 4, title: "Review Output", subtitle: "Compare and export the result" },
];

const VIEW_MODES = [
  { id: "side-by-side", label: "Side-by-side" },
  { id: "original", label: "Original" },
  { id: "reformatted", label: "Reformatted" },
];

const DOCUMENT_SOURCE_TABS = [
  { id: "library", label: "My Docs" },
  { id: "upload", label: "Upload" },
];

export function FormattingCheckerPage() {
  const [formatStyle, setFormatStyle] = useState("APA");
  const [documentsState, setDocumentsState] = useState({ status: "loading", items: [], error: "" });
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentState, setDocumentState] = useState({ status: "idle", error: "" });
  const [uploadState, setUploadState] = useState({ status: "idle", error: "" });
  const [documentSource, setDocumentSource] = useState("library");
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [highlightChanges, setHighlightChanges] = useState(true);
  const [viewMode, setViewMode] = useState("original");
  const [supportsWideCompare, setSupportsWideCompare] = useState(false);
  const [reformatState, setReformatState] = useState({ status: "idle", data: null, error: "" });

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      const token = window.localStorage.getItem("smartreview-token");
      try {
        const response = await fetch("/api/v1/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Unable to load documents");
        if (!active) return;
        const items = payload.documents || [];
        setDocumentsState({ status: "idle", items, error: "" });
        if (items.length && !selectedDocumentId) {
          setSelectedDocumentId(items[0].documentId);
        }
      } catch (error) {
        if (active) setDocumentsState({ status: "idle", items: [], error: error.message });
      }
    }

    loadDocuments();
    return () => {
      active = false;
    };
  }, [selectedDocumentId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 1536px)");
    const syncWideCompare = (event) => {
      const matches = event.matches ?? event.currentTarget?.matches ?? mediaQuery.matches;
      setSupportsWideCompare(matches);
      setViewMode((current) => (current === "side-by-side" ? (matches ? "side-by-side" : "original") : current));
    };

    syncWideCompare(mediaQuery);
    mediaQuery.addEventListener("change", syncWideCompare);
    return () => mediaQuery.removeEventListener("change", syncWideCompare);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDocument() {
      if (!selectedDocumentId) {
        setSelectedDocument(null);
        return;
      }

      const token = window.localStorage.getItem("smartreview-token");
      setDocumentState({ status: "loading", error: "" });

      try {
        const response = await fetch(`/api/v1/documents/${selectedDocumentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Unable to load selected document");
        if (active) {
          setSelectedDocument(payload);
          setDocumentState({ status: "idle", error: "" });
        }
      } catch (error) {
        if (active) {
          setSelectedDocument(null);
          setDocumentState({ status: "idle", error: error.message });
        }
      }
    }

    loadDocument();
    return () => {
      active = false;
    };
  }, [selectedDocumentId]);

  const canReformat = Boolean(selectedDocument?.text && reformatState.status !== "loading");
  const hasFormattedOutput = Boolean(reformatState.data?.formattedText);
  const currentViewMode = hasFormattedOutput ? viewMode : "original";
  const formattedText = reformatState.data?.formattedText || "";

  const formattedPreview = useMemo(() => {
    if (!formattedText || !selectedDocument?.text) return null;
    return buildPreview(formattedText, formatStyle, highlightChanges);
  }, [formatStyle, formattedText, highlightChanges, selectedDocument]);

  const originalMeta = {
    pages: estimatePages(selectedDocument?.text || ""),
    words: wordCount(selectedDocument?.text || ""),
    characters: (selectedDocument?.text || "").length,
    format: fileTypeLabel(selectedDocument?.mime),
  };
  const reformattedMeta = {
    pages: estimatePages(formattedText),
    words: wordCount(formattedText),
    characters: formattedText.length,
    format: formatStyle,
  };

  async function uploadDocument(file) {
    if (!file) return;
    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadState({ status: "idle", error: validationError });
      return;
    }

    setUploadState({ status: "loading", error: "" });

    const token = window.localStorage.getItem("smartreview-token");
    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Upload failed");

      setDocumentsState((current) => ({
        ...current,
        items: [{
          documentId: payload.documentId,
          fileName: payload.fileName,
          mime: payload.mime,
          size: payload.size,
          structure: payload.structure,
          textPreview: payload.textPreview,
          createdAt: new Date().toISOString(),
        }, ...current.items],
      }));
      setDocumentSource("library");
      setSelectedDocumentId(payload.documentId);
      setUploadState({ status: "idle", error: "" });
    } catch (error) {
      setUploadState({ status: "idle", error: error.message });
    }
  }

  async function handleReformat() {
    if (!selectedDocument?.text) return;

    const token = window.localStorage.getItem("smartreview-token");
    setReformatState({ status: "loading", data: null, error: "" });

    try {
      const response = await fetch("/api/v1/tools/formatting", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedDocument.text,
          style: formatStyle === "Harvard" ? "Custom" : formatStyle,
          customRules: formatStyle === "Harvard" ? "Harvard referencing style" : "",
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to reformat document");

      setReformatState({
        status: "idle",
        data: {
          style: formatStyle,
          violations: payload.violations || [],
          disclaimer: payload.disclaimer,
          formattedText: reformatDocument(selectedDocument.text, formatStyle, preserveStructure),
        },
        error: "",
      });
      setViewMode(supportsWideCompare ? "side-by-side" : "original");
    } catch (error) {
      setReformatState({ status: "idle", data: null, error: error.message });
    }
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function copyFormattedText() {
    if (!formattedText) return;
    navigator.clipboard.writeText(formattedText).catch(() => {});
  }

  return (
    <main className="workspace-screen workspace-screen--formatting">
      <div className="workspace-screen__container workspace-screen__container--full workspace-screen__container--formatting">
        <Section
          className="workspace-title-block"
          eyebrow="Format Tracker"
          title="Formatting Checker"
          description="Reformat a document into APA, MLA, Chicago, or Harvard style without crowding a 1300px workspace."
        />

        <section className="format-step-strip" aria-label="Formatting workflow steps">
          {STEPS.map((step) => (
            <article key={step.number} className="format-step-strip__item">
              <div className="step-badge">{step.number}</div>
              <div>
                <strong>{step.title}</strong>
                <span>{step.subtitle}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="format-workspace-grid">
          <Section
            className="format-card format-card--composer"
            eyebrow="Steps 1-2"
            title="Select format and document"
            description="Choose a style, then pull in a document from your library or upload a new file."
          >
            <div className="format-composer-grid">
              <div className="format-composer-block">
                <div className="format-composer-block__header">
                  <strong>Select Format</strong>
                  <span>Compact style presets</span>
                </div>
                <div className="format-style-grid">
                  {FORMAT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`format-style-card${formatStyle === option.id ? " is-active" : ""}`}
                      onClick={() => setFormatStyle(option.id)}
                      aria-pressed={formatStyle === option.id}
                    >
                      <div className="format-style-card__copy">
                        <strong>{option.title}</strong>
                        <span>{option.subtitle}</span>
                      </div>
                      {formatStyle === option.id ? (
                        <span className="format-style-card__check" aria-hidden="true">
                          <Icon name="shield" />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
                <div className="info-banner">
                  <Icon name="help-circle" />
                  <span>Your document will be aligned to the latest {formatStyle} expectations before download.</span>
                </div>
              </div>

              <div className="format-composer-block">
                <div className="format-composer-block__header">
                  <strong>Choose / Upload Document</strong>
                  <span>Switch between your library and a fresh upload.</span>
                </div>
                <div className="segmented-control segmented-control--tabs" role="tablist" aria-label="Document source">
                  {DOCUMENT_SOURCE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={documentSource === tab.id}
                      className={documentSource === tab.id ? "is-active" : ""}
                      onClick={() => setDocumentSource(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {documentsState.status === "loading" ? <UniversalLoader label="Loading documents..." /> : null}
                {documentsState.error ? <p className="error-text">{documentsState.error}</p> : null}

                {documentSource === "library" ? (
                  <Card className="format-document-panel format-tab-panel">
                    <div className="format-document-panel__header">
                      <strong>Your Documents</strong>
                      <select value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)} aria-label="Select document">
                        {documentsState.items.length ? (
                          documentsState.items.map((document) => (
                            <option key={document.documentId} value={document.documentId}>{document.fileName}</option>
                          ))
                        ) : (
                          <option value="">No documents available</option>
                        )}
                      </select>
                    </div>

                    {documentState.status === "loading" ? <p className="format-muted">Loading selected document...</p> : null}
                    {documentState.error ? <p className="error-text">{documentState.error}</p> : null}

                    <div className="format-document-list">
                      {documentsState.items.length ? (
                        documentsState.items.slice(0, 4).map((document) => (
                          <button
                            key={document.documentId}
                            type="button"
                            className={`format-document-row${selectedDocumentId === document.documentId ? " is-active" : ""}`}
                            onClick={() => setSelectedDocumentId(document.documentId)}
                          >
                            <span className="format-document-row__radio" aria-hidden="true" />
                            <span className={`format-document-row__type format-document-row__type--${fileTypeToken(document.mime)}`}>
                              {fileTypeLabel(document.mime)}
                            </span>
                            <span className="format-document-row__copy">
                              <strong>{document.fileName}</strong>
                              <span>{formatDate(document.createdAt)} • {formatBytes(document.size)}</span>
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="format-muted">Upload a document to start formatting.</p>
                      )}
                    </div>
                    <Link className="format-inline-link" to="/documents">View all documents</Link>
                  </Card>
                ) : (
                  <Card className="format-upload-panel format-tab-panel">
                    <strong>Upload a new document</strong>
                    <label className="format-upload-dropzone">
                      <span className="format-upload-dropzone__icon">
                        <Icon name="upload" />
                      </span>
                      <span>Drop a file here or browse from your device.</span>
                      <span className="format-upload-dropzone__cta">
                        <Button as="span" variant="primary" size="sm" icon={<Icon name="upload" />}>
                          {uploadState.status === "loading" ? "Uploading..." : "Upload Document"}
                        </Button>
                      </span>
                      <small>Accepted: .docx, .pdf, .txt, .pptx</small>
                      <small>Max file size: 50MB</small>
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.docx,.txt,.pptx"
                        disabled={uploadState.status === "loading"}
                        onChange={(event) => uploadDocument(event.target.files?.[0])}
                      />
                    </label>
                    {uploadState.error ? <p className="error-text">{uploadState.error}</p> : null}
                  </Card>
                )}
              </div>
            </div>
          </Section>

          <Section
            className="format-card format-card--action"
            eyebrow="Step 3"
            title="AI Reformat"
            description={`AI will reformat your document to match ${formatStyle} style guidelines.`}
          >
            <div className="format-action-panel">
              <label className="switch-row">
                <div className="switch-row__copy">
                  <strong>Preserve original structure</strong>
                  <span>Keep headings and paragraph breaks where possible.</span>
                </div>
                <span className={`switch-track${preserveStructure ? " is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={preserveStructure}
                    onChange={() => setPreserveStructure((value) => !value)}
                    aria-label="Preserve original structure"
                  />
                  <span className="switch-thumb" />
                </span>
              </label>

              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={<Icon name="sparkles" />}
                onClick={handleReformat}
                disabled={!canReformat}
              >
                {reformatState.status === "loading" ? `Reformatting ${formatStyle}...` : `Reformat to ${formatStyle}`}
              </Button>

              <Card className="format-action-summary">
                <div>
                  <strong>Selected style</strong>
                  <span>{formatStyle}</span>
                </div>
                <div>
                  <strong>Document</strong>
                  <span>{selectedDocument?.fileName || "No file selected"}</span>
                </div>
                <div>
                  <strong>Words</strong>
                  <span>{originalMeta.words || 0}</span>
                </div>
              </Card>

              <div className="format-action-note">
                <Icon name="shield" />
                <span>{selectedDocument?.text ? "Document ready for AI reformatting." : "Select or upload a document to continue."}</span>
              </div>
              {reformatState.error ? <p className="error-text">{reformatState.error}</p> : null}
            </div>
          </Section>
        </section>

        <Section
          className="format-preview-shell"
          eyebrow="Step 4"
          title="Review Output"
          description={hasFormattedOutput ? `Inspect the ${formatStyle} result before replacing or exporting it.` : "Run AI reformat to compare the original and formatted document here."}
          actions={hasFormattedOutput ? <span className="status-chip status-chip--success">Reformatted</span> : null}
        >
          <div className="format-preview-shell__toolbar">
            <div className="format-preview-shell__toolbar-main">
              <div className="segmented-control" role="tablist" aria-label="Preview modes">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={currentViewMode === mode.id ? "is-active" : ""}
                    onClick={() => setViewMode(mode.id)}
                    disabled={!hasFormattedOutput && mode.id !== "original"}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <label className="switch-row switch-row--compact">
                <span>Highlight changes</span>
                <span className={`switch-track${highlightChanges ? " is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={highlightChanges}
                    onChange={() => setHighlightChanges((value) => !value)}
                    aria-label="Highlight changes"
                    disabled={!hasFormattedOutput}
                  />
                  <span className="switch-thumb" />
                </span>
              </label>
            </div>

            <div className="format-preview-shell__actions">
              <Button variant="outline" size="sm" icon={<Icon name="file-text" />} onClick={copyFormattedText} disabled={!hasFormattedOutput}>Copy</Button>
              <Button variant="outline" size="sm" icon={<Icon name="document" />} onClick={() => downloadText(`${safeFileName(selectedDocument?.fileName || "formatted")}-${formatStyle.toLowerCase()}.txt`, formattedText)} disabled={!hasFormattedOutput}>Download</Button>
              <Button variant="primary" size="sm" icon={<Icon name="repeat" />} onClick={() => setSelectedDocument((current) => current ? { ...current, text: formattedText } : current)} disabled={!hasFormattedOutput}>Replace</Button>
            </div>
          </div>

          {viewMode === "side-by-side" && !supportsWideCompare ? (
            <p className="format-muted">Side-by-side stays stacked on smaller screens and switches to two columns at 1536px and above.</p>
          ) : null}

          {hasFormattedOutput ? (
            <div className={`format-preview-grid format-preview-grid--${currentViewMode}`}>
              {(currentViewMode === "side-by-side" || currentViewMode === "original") ? (
                <Card className="format-preview-card">
                  <div className="format-preview-card__header">
                    <strong>Original Document</strong>
                    <span>Read only</span>
                  </div>
                  <details className="format-preview-card__details">
                    <summary>Document metadata</summary>
                    <div className="format-preview-card__meta">
                      <span>Format: {originalMeta.format}</span>
                      <span>Pages: {originalMeta.pages}</span>
                      <span>Words: {originalMeta.words}</span>
                      <span>Characters: {originalMeta.characters}</span>
                    </div>
                  </details>
                  <div className="format-preview-card__body">
                    <pre>{selectedDocument?.text || ""}</pre>
                  </div>
                </Card>
              ) : null}

              {(currentViewMode === "side-by-side" || currentViewMode === "reformatted") ? (
                <Card className="format-preview-card">
                  <div className="format-preview-card__header">
                    <strong>{formatStyle} Formatted</strong>
                    <span>AI generated</span>
                  </div>
                  <details className="format-preview-card__details">
                    <summary>Document metadata</summary>
                    <div className="format-preview-card__meta">
                      <span>Format: {reformattedMeta.format}</span>
                      <span>Pages: {reformattedMeta.pages}</span>
                      <span>Words: {reformattedMeta.words}</span>
                      <span>Characters: {reformattedMeta.characters}</span>
                    </div>
                  </details>
                  <div className="format-preview-card__body">
                    <pre>{formattedPreview}</pre>
                  </div>
                </Card>
              ) : null}
            </div>
          ) : (
            <Card className="format-preview-card format-preview-card--empty">
              <div className="format-preview-card__empty">
                <span className="format-upload-dropzone__icon">
                  <Icon name="format" />
                </span>
                <div>
                  <strong>No reformatted output yet</strong>
                  <p>Select a document, choose a format, and run AI Reformat to review the result here.</p>
                </div>
              </div>
            </Card>
          )}
        </Section>
      </div>
    </main>
  );
}

function reformatDocument(text, style, preserveStructure) {
  const normalized = String(text || "").trim().replace(/\r\n/g, "\n");
  if (!normalized) return "";

  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const title = paragraphs[0] || "Untitled Document";
  const body = paragraphs.slice(1);
  const author = "Smith, J.";
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const intro = `${author} (${date}). ${title.replace(/[.!?]+$/, "")}.`;
  const formattedBody = body.length ? body : [normalized];
  const transformed = formattedBody.map((paragraph) => {
    if (!preserveStructure) {
      return paragraph.replace(/\s+/g, " ");
    }
    return paragraph;
  });

  if (style === "MLA") {
    return ["Student Name", "Instructor Name", "Course Name", date, "", title, "", ...transformed].join("\n\n");
  }
  if (style === "Chicago") {
    return [title, "", `Prepared on ${date}`, "", ...transformed].join("\n\n");
  }
  if (style === "Harvard") {
    return [intro, "", ...transformed, "", "References", "Author, A. (2024) Sample reference entry."].join("\n\n");
  }
  return [intro, "", ...transformed, "", "References", "Author, A. (2024). Sample reference entry."].join("\n\n");
}

function buildPreview(text, style, highlightChanges) {
  if (!highlightChanges) return text;
  if (style === "APA") {
    return text.replace(/^(.+)$/m, ">> $1");
  }
  return text;
}

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function estimatePages(text) {
  return Math.max(1, Math.ceil(wordCount(text) / 250));
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
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

function fileTypeToken(mime) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/plain") return "txt";
  if (mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return "ppt";
  return "doc";
}

function safeFileName(name) {
  return String(name || "document").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-");
}
