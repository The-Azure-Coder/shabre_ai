"use client";

import { useEffect, useMemo, useState } from "react";
import { FeaturePage } from "@/components/pages/feature-page";
import { DocumentPreview } from "@/components/document/document-preview";

export function ReviewDetailPage({ reviewId }) {
  const [state, setState] = useState({ status: "loading", review: null, error: "" });
  const changeLog = useMemo(() => buildChangeLog(state.review?.suggestions || []), [state.review]);

  useEffect(() => {
    let active = true;
    async function load() {
      const token = window.localStorage.getItem("smartreview-token");
      try {
        const response = await fetch(`/api/v1/reviews/${reviewId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Unable to load review");
        if (active) setState({ status: "idle", review: payload, error: "" });
      } catch (error) {
        if (active) setState({ status: "idle", review: null, error: error.message });
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [reviewId]);

  return (
    <FeaturePage title="Review Details" description="Detailed assignment feedback grounded in the uploaded document." primaryHref="/reviews" primaryLabel="Back to Reviews">
      {state.status === "loading" && <section className="panel"><p>Loading review...</p></section>}
      {state.error && <section className="panel"><p className="error-text">{state.error}</p></section>}
      {state.review && (
        <section className="review-detail-grid">
          <article className="panel review-document">
            <div className="panel-heading">
              <div>
                <h2>{state.review.document.fileName}</h2>
                <p>{state.review.summary}</p>
              </div>
              <strong className="score-pill">{overallScore(state.review.scores)}%</strong>
            </div>
            <h3>Structured Preview</h3>
            <DocumentPreview
              document={state.review.document}
              suggestions={state.review.suggestions}
              showToolbar={false}
            />
          </article>
          <aside className="panel feedback-summary">
            <h2>Feedback Summary</h2>
            {["grammar", "clarity", "logic"].map((type) => (
              <article key={type}>
                <strong>{label(type)}</strong>
                {state.review.suggestions.filter((item) => item.type === type).map((item) => (
                  <p key={`${type}-${item.location.paragraph}`}>{item.suggestion}</p>
                ))}
              </article>
            ))}
          </aside>
          <article className="panel detail-span">
            <h2>Suggestions</h2>
            <div className="result-list">
              {changeLog.map((item) => (
                <article key={item.key}>
                  <strong>{label(item.type)} | Paragraph {item.paragraph}</strong>
                  <span>{item.severity}</span>
                  <p><strong>Original:</strong> {item.original}</p>
                  <p><strong>Suggested:</strong> {item.suggestion}</p>
                  <small>{item.reason}</small>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}
    </FeaturePage>
  );
}

function overallScore(scores) {
  if (!Array.isArray(scores) || !scores.length) return 0;
  const ratio = scores.reduce((sum, item) => sum + item.score / Math.max(item.maxScore, 1), 0) / scores.length;
  return Math.round(ratio * 100);
}

function label(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildChangeLog(suggestions) {
  return (Array.isArray(suggestions) ? suggestions : []).map((item, index) => ({
    key: `${item.type}-${item.location?.paragraph || index}-${index}`,
    type: item.type,
    paragraph: item.location?.paragraph || 1,
    severity: item.severity,
    original: item.original,
    suggestion: item.suggestion,
    reason: item.reason,
  }));
}
