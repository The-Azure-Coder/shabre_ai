import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FeaturePage } from "@/components/pages/feature-page";
import { validateUploadFile } from "@/lib/upload-constraints";

export function DocumentsListPage() {
  const [state, setState] = useResource("/api/v1/documents", "documents");
  const [uploadStatus, setUploadStatus] = useState({ state: "idle", error: "" });

  async function uploadDocument(file) {
    if (!file) return;
    const token = window.localStorage.getItem("smartreview-token");
    setUploadStatus({ state: "loading", error: "" });
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Upload failed");
      setState((current) => ({
        ...current,
        items: [{
          documentId: payload.documentId,
          fileName: payload.fileName,
          mime: payload.mime,
          size: payload.size,
          structure: payload.structure,
          textPreview: payload.textPreview,
          contentHtml: payload.contentHtml || null,
          createdAt: new Date().toISOString(),
          latestReview: null,
        }, ...current.items],
      }));
      setUploadStatus({ state: "idle", error: "" });
    } catch (error) {
      setUploadStatus({ state: "idle", error: error.message });
    }
  }

  async function deleteDocument(documentId) {
    if (!window.confirm("Delete this document and its reviews?")) return;
    const token = window.localStorage.getItem("smartreview-token");
    const response = await fetch(`/api/v1/documents/${documentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      setState((current) => ({ ...current, error: payload.error?.message || "Delete failed" }));
      return;
    }
    setState((current) => ({
      ...current,
      items: current.items.filter((item) => item.documentId !== documentId),
    }));
  }

  return (
    <FeaturePage title="My Documents" description="Uploaded assignments, extracted previews, and latest review status." primaryLabel="Dashboard">
      <section className="panel upload-strip">
        <div>
          <h2>Upload Document</h2>
          <p>Upload PDF, DOCX, TXT, or PPTX files for extraction and review.</p>
        </div>
        <label className="file-button">
          {uploadStatus.state === "loading" ? "Uploading..." : "Upload Document"}
          <input type="file" accept=".pdf,.docx,.txt,.pptx" disabled={uploadStatus.state === "loading"} onChange={(event) => uploadDocument(event.target.files?.[0])} />
        </label>
        {uploadStatus.error && <p className="error-text">{uploadStatus.error}</p>}
      </section>
      <section className="panel data-panel">
        <ResourceStatus state={state} emptyText="No uploaded documents yet." />
        <div className="data-list">
          {state.items.map((document) => (
            <article key={document.documentId} className="data-row">
              <div>
                <strong>{document.fileName}</strong>
                {document.structure?.title ? <p>{document.structure.title}</p> : null}
                <small>
                  {document.structure?.wordCount || 0} words
                  {" · "}
                  {fileTypeLabel(document.mime)}
                  {" · "}
                  {formatBytes(document.size)}
                  {" · "}
                  {formatDateTime(document.createdAt)}
                </small>
              </div>
              <div className="row-actions">
                {document.latestReview ? <Link to={`/reviews/${document.latestReview.reviewId}`}>Review</Link> : <Link to={`/documents/${document.documentId}`}>Open in Editor</Link>}
                <button type="button" onClick={() => deleteDocument(document.documentId)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </FeaturePage>
  );
}

export function ReviewsListPage() {
  const [state] = useResource("/api/v1/reviews", "reviews");
  const [uploadStatus, setUploadStatus] = useState({ state: "idle", error: "" });
  const navigate = useNavigate();

  async function uploadForReview(file) {
    if (!file) return;
    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadStatus({ state: "idle", error: validationError });
      return;
    }

    const token = window.localStorage.getItem("smartreview-token");
    setUploadStatus({ state: "loading", error: "" });
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Upload failed");

      window.sessionStorage.setItem("pending-review-doc", JSON.stringify(payload));
      navigate({ to: "/reviews/workspace" });
    } catch (error) {
      setUploadStatus({ state: "idle", error: error.message });
    }
  }

  return (
    <FeaturePage title="Reviews" description="Review reports with scores, suggestions, and formatting feedback." primaryHref="/reviews/workspace" primaryLabel="Start New Review">
      <section className="panel upload-strip">
        <div>
          <h2>Upload for Review</h2>
          <p>Start a new rubric-based review by uploading your assignment.</p>
        </div>
        <label className="file-button">
          {uploadStatus.state === "loading" ? "Uploading..." : "Upload Document"}
          <input type="file" accept=".pdf,.docx,.txt,.pptx" disabled={uploadStatus.state === "loading"} onChange={(event) => uploadForReview(event.target.files?.[0])} />
        </label>
        {uploadStatus.error && <p className="error-text">{uploadStatus.error}</p>}
      </section>

      <section className="panel data-panel">
        <ResourceStatus state={state} emptyText="No reviews have been created yet." />
        <div className="data-list">
          {state.items.map((review) => (
            <article key={review.reviewId} className="data-row">
              <div>
                <strong>{review.fileName}</strong>
                <small>{review.status} · {formatDate(review.createdAt)}</small>
                <p>{review.summary}</p>
                <div className="inline-tags">
                  {review.scores.slice(0, 3).map((score) => <span key={score.criterion}>{score.criterion}: {score.score}/{score.maxScore}</span>)}
                </div>
              </div>
              <div className="result-list slim">
                {review.suggestions.slice(0, 3).map((item) => (
                  <article key={`${review.reviewId}-${item.type}`}>
                    <strong>{item.type}</strong>
                    <p>{item.suggestion}</p>
                  </article>
                ))}
              </div>
              <div className="row-actions">
                <Link to={`/reviews/${review.reviewId}`}>View Report</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </FeaturePage>
  );
}

export function ResourceListPage({ type }) {
  if (type === "documents") return <DocumentsListPage />;
  if (type === "reviews") return <ReviewsListPage />;
  return null;
}

function useResource(endpoint, key) {
  const [state, setState] = useState({ status: "loading", items: [], error: "" });

  useEffect(() => {
    let active = true;

    async function load() {
      const token = window.localStorage.getItem("smartreview-token");
      try {
        const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Request failed");
        if (active) setState({ status: "idle", items: payload[key] || [], error: "" });
      } catch (error) {
        if (active) setState({ status: "idle", items: [], error: error.message });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [endpoint, key]);

  return [state, setState];
}

function ResourceStatus({ state, emptyText }) {
  if (state.status === "loading") return <p>Loading...</p>;
  if (state.error) return <p className="error-text">{state.error}</p>;
  if (!state.items.length) return <p className="empty-state">{emptyText}</p>;
  return null;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
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
