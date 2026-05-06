import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Icon } from "@/lib/icons";
import { DocumentPreview } from "@/components/document/document-preview";
import { validateUploadFile } from "@/lib/upload-constraints";
import { Button } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/surfaces";

const PREDEFINED_RUBRICS = [
  {
    name: "Standard Academic",
    criteria: "Argument: 10\nEvidence: 10\nOrganization: 10\nStyle & Mechanics: 10",
  },
  {
    name: "Creative Writing",
    criteria: "Voice: 10\nCharacterization: 10\nPlot/Structure: 10\nImagery: 10",
  },
  {
    name: "Technical Report",
    criteria: "Clarity: 10\nAccuracy: 10\nData Presentation: 10\nConclusion: 10",
  },
];

const REVIEW_STEPS = [
  {
    key: "document",
    number: 1,
    title: "Upload Document",
    description: "Upload your assignment file to get started.",
    empty: "No document uploaded",
    action: "Upload Document",
    accepts: "Accepted formats: .docx, .pdf, .txt, .pptx",
    limit: "Max size: 50MB",
    icon: "upload",
  },
  {
    key: "rubric",
    number: 2,
    title: "Upload Rubric",
    description: "Upload the evaluation rubric to guide the review.",
    empty: "No rubric uploaded",
    action: "Upload Rubric",
    accepts: "Accepted formats: .txt, .md, .csv",
    limit: "Max size: 25MB",
    icon: "rubric",
  },
];

const CITATION_STYLES = ["APA", "MLA", "Chicago", "Harvard"];

export function ReviewWorkspace() {
  const [document, setDocument] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "", progress: 0 });
  const [error, setError] = useState("");
  const [rubricText, setRubricText] = useState(PREDEFINED_RUBRICS[0].criteria);
  const [rubricSourceName, setRubricSourceName] = useState(PREDEFINED_RUBRICS[0].name);
  const [reviewResult, setReviewResult] = useState(null);
  const [style, setStyle] = useState("APA");
  const fileInputRef = useRef(null);
  const rubricInputRef = useRef(null);
  const search = useSearch({ from: "/reviews/workspace" });

  useEffect(() => {
    let active = true;

    async function loadDocument() {
      const documentId = search.documentId;
      if (documentId) {
        const token = window.localStorage.getItem("smartreview-token");
        try {
          const response = await fetch(`/api/v1/documents/${documentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error?.message || "Unable to load document");
          if (active) {
            setDocument(payload);
            setError("");
          }
          return;
        } catch (loadError) {
          if (active) setError(loadError.message);
          return;
        }
      }

      const pending = window.sessionStorage.getItem("pending-review-doc");
      if (pending) {
        try {
          const doc = JSON.parse(pending);
          if (active) setDocument(doc);
          window.sessionStorage.removeItem("pending-review-doc");
        } catch {
          window.sessionStorage.removeItem("pending-review-doc");
        }
      }
    }

    loadDocument();
    return () => {
      active = false;
    };
  }, [search]);

  const parsedCriteria = useMemo(() => parseRubricCriteria(rubricText), [rubricText]);
  const hasRubric = rubricText.trim().length > 0;
  const canReview = Boolean(document && hasRubric && status.state !== "reviewing");
  const completionCount = [Boolean(document), hasRubric, Boolean(style), Boolean(document && hasRubric)].filter(Boolean).length;
  const overall = reviewResult?.overallScore || overallScore(reviewResult?.scores);

  async function handleFileUpload(file) {
    if (!file) return;
    const validationError = validateUploadFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStatus({ state: "uploading", message: "Uploading document...", progress: 10 });

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

      setDocument(payload);
      watchProgress(payload.wsTopic, token);
      setReviewResult(null);
      setStatus({ state: "idle", message: "Document ready", progress: 100 });
    } catch (err) {
      setError(err.message);
      setStatus({ state: "error", message: "Upload failed", progress: 0 });
    }
  }

  async function handleRubricUpload(file) {
    if (!file) return;

    try {
      const text = await file.text();
      setRubricText(text || "");
      setRubricSourceName(file.name);
      setError("");
    } catch (readError) {
      setError(readError.message || "Unable to read rubric file");
    }
  }

  async function handleReview() {
    if (!document) return;

    setError("");
    setReviewResult(null);
    setStatus({ state: "reviewing", message: "Evaluating against rubric...", progress: 30 });

    const token = window.localStorage.getItem("smartreview-token");

    try {
      const response = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.documentId,
          style,
          rubric: {
            criteria: parsedCriteria,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message || "Review failed");
      }

      const jobId = payload.jobId;
      const reviewId = payload.reviewId;
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws/progress?jobId=${jobId}&token=${encodeURIComponent(token || "")}`);

      socket.onmessage = async (event) => {
        const update = JSON.parse(event.data);
        setStatus((current) => ({ ...current, message: update.message, progress: update.progress }));

        if (update.event === "complete") {
          try {
            const reviewResponse = await fetch(`/api/v1/reviews/${reviewId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const reviewData = await reviewResponse.json();
            setReviewResult(reviewData);
            setStatus({ state: "idle", message: "Review complete", progress: 100 });
            socket.close();
          } catch {
            setError("Failed to fetch final review results.");
            setStatus({ state: "error", message: "Fetch failed", progress: 100 });
          }
        } else if (update.event === "error") {
          setError(update.message || "Review process failed.");
          setStatus({ state: "error", message: "Review failed", progress: 0 });
          socket.close();
        }
      };

      socket.onerror = () => {
        setError("WebSocket connection failed. The review may still be processing in the background.");
      };
    } catch (reviewError) {
      setError(reviewError.message);
      setStatus({ state: "error", message: "Review failed", progress: 0 });
    }
  }

  function watchProgress(jobId, token) {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/progress?jobId=${jobId}&token=${encodeURIComponent(token)}`);

    socket.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setStatus((current) => {
        if (current.progress >= 100 && update.progress < 100) return current;
        return { ...current, message: update.message, progress: update.progress };
      });
      if (update.event === "complete" || update.event === "error") {
        socket.close();
      }
    };
  }

  return (
    <main className="workspace-screen workspace-screen--review">
      <div className="workspace-screen__container">
        <div className="workspace-screen__main">
          <Section
            className="workspace-hero"
            title="Review Workspace"
            description="Follow the steps below to upload your assignment, select a rubric, choose citation style, and get AI-powered feedback."
          >
            <div className="review-step-grid" role="list" aria-label="Review setup steps">
              {REVIEW_STEPS.map((step) => (
                <UploadStepCard
                  key={step.key}
                  step={step}
                  document={step.key === "document" ? document : null}
                  rubricName={step.key === "rubric" ? rubricSourceName : ""}
                  criteriaCount={parsedCriteria.length}
                  busy={status.state === "uploading" && step.key === "document"}
                  onClick={() => (step.key === "document" ? fileInputRef.current?.click() : rubricInputRef.current?.click())}
                />
              ))}

              <Card className="review-step-card" role="listitem">
                <StepBadge number={3} />
                <div className="review-step-card__icon review-step-card__icon--style">
                  <Icon name="format" />
                </div>
                <div className="review-step-card__content">
                  <h3>Select Citation Style</h3>
                  <p>Choose your preferred citation style for the review.</p>
                  <label className="workspace-field">
                    <span className="sr-only">Citation style</span>
                    <select value={style} onChange={(event) => setStyle(event.target.value)} aria-label="Citation style">
                      {CITATION_STYLES.map((option) => (
                        <option key={option} value={option}>{option} Style</option>
                      ))}
                    </select>
                  </label>
                </div>
              </Card>

              <Card className="review-step-card" role="listitem">
                <StepBadge number={4} />
                <div className="review-step-card__icon review-step-card__icon--review">
                  <Icon name="sparkles" />
                </div>
                <div className="review-step-card__content">
                  <h3>Review Against Rubric</h3>
                  <p>Start the AI review and receive detailed academic feedback.</p>
                  <Button
                    variant="primary"
                    fullWidth
                    icon={<Icon name="sparkles" />}
                    onClick={handleReview}
                    disabled={!canReview}
                    aria-disabled={!canReview}
                  >
                    {status.state === "reviewing" ? "Reviewing..." : "Review Against Rubric"}
                  </Button>
                </div>
              </Card>
            </div>

            <div className="review-helper-bar" aria-live="polite">
              <div className="review-helper-bar__status">
                <Icon name="help-circle" />
                <span>{canReview ? "All steps completed. You can start the AI review." : "Complete all steps above to enable the review process."}</span>
              </div>
              <div className="review-helper-bar__meta">
                <span>Format: .docx, .pdf, .txt, .pptx</span>
                <span>Max size: 50MB</span>
              </div>
            </div>

            {status.state !== "idle" ? (
              <div className="workspace-progress" aria-live="polite">
                <div className="workspace-progress__copy">
                  <span>{status.message}</span>
                  <span>{status.progress}%</span>
                </div>
                <progress value={status.progress} max="100" />
              </div>
            ) : null}

            {error ? (
              <div className="workspace-alert" role="alert">
                <Icon name="shield" />
                <span>{error}</span>
              </div>
            ) : null}

            <input
              type="file"
              ref={fileInputRef}
              onChange={(event) => handleFileUpload(event.target.files?.[0])}
              hidden
              accept=".pdf,.docx,.txt,.pptx"
            />
            <input
              type="file"
              ref={rubricInputRef}
              onChange={(event) => handleRubricUpload(event.target.files?.[0])}
              hidden
              accept=".txt,.md,.csv"
            />
          </Section>

          <Section
            className="workspace-document"
            title={document ? document.fileName : "Document Preview"}
            description={document ? `${document.structure?.wordCount || 0} words • ${formatBytes(document.size || 0)}` : "Your uploaded document will appear here once ready."}
          >
            {document ? (
              <Card className="workspace-document__preview">
                <DocumentPreview
                  document={document}
                  suggestions={reviewResult?.suggestions || []}
                  showToolbar={false}
                  title={document.fileName}
                />
              </Card>
            ) : (
              <Card className="workspace-empty-card">
                <div className="workspace-empty-card__icon">
                  <Icon name="document" />
                </div>
                <h3>Upload a document to begin</h3>
                <p>Your assignment preview, highlighted suggestions, and rubric-linked review notes will appear here.</p>
                <Button variant="secondary" icon={<Icon name="upload" />} onClick={() => fileInputRef.current?.click()}>
                  Select Document
                </Button>
              </Card>
            )}
          </Section>
        </div>

        <aside className="workspace-screen__side">
          <Section
            className="workspace-sidebar-card"
            title="Rubric Configuration"
            actions={<span className="status-chip status-chip--required">Required</span>}
          >
            <div className="rubric-config">
              <div className="rubric-config__group">
                <span className="workspace-label">Rubric Type</span>
                <div className="rubric-pills">
                  {PREDEFINED_RUBRICS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={`rubric-pill${rubricSourceName === preset.name ? " is-active" : ""}`}
                      onClick={() => {
                        setRubricText(preset.criteria);
                        setRubricSourceName(preset.name);
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <Card className="rubric-summary-card">
                <div className="rubric-summary-card__header">
                  <strong>Evaluation Criteria ({parsedCriteria.length})</strong>
                </div>
                <div className="rubric-criteria-list">
                  {parsedCriteria.map((criterion) => (
                    <div key={criterion.name} className="rubric-criteria-row">
                      <div className="rubric-criteria-row__title">
                        <span className="rubric-criteria-row__icon">
                          <Icon name="shield" />
                        </span>
                        <span>{criterion.name}</span>
                      </div>
                      <span>{criterion.maxScore} points</span>
                    </div>
                  ))}
                </div>
                <div className="rubric-criteria-total">
                  <span>Total</span>
                  <strong>{parsedCriteria.reduce((sum, item) => sum + item.maxScore, 0)} points</strong>
                </div>
              </Card>

              <label className="workspace-label" htmlFor="rubric-textarea">Rubric Criteria</label>
              <textarea
                id="rubric-textarea"
                className="workspace-textarea"
                value={rubricText}
                onChange={(event) => {
                  setRubricText(event.target.value);
                  setRubricSourceName("Custom Rubric");
                }}
                placeholder="Criterion: Weight"
              />
              <p className="workspace-help">
                <Icon name="help-circle" />
                <span>Format each line as `Name: MaxScore`.</span>
              </p>
            </div>
          </Section>

          {reviewResult ? (
            <Section className="workspace-sidebar-card" title="Rubric Summary">
              <Card className="review-score-card">
                <div className="review-score-card__ring">
                  <strong>{overall}</strong>
                  <span>/100</span>
                </div>
                <div>
                  <h3>Overall Performance</h3>
                  <p>{reviewResult.summary || `Calculated from ${parsedCriteria.length} rubric criteria.`}</p>
                </div>
              </Card>

              <Card className="workspace-note-card">
                <strong>Criterion Breakdown</strong>
                <div className="criterion-list">
                  {(reviewResult.scores || []).map((score) => (
                    <article key={score.criterion} className="criterion-item">
                      <div className="criterion-item__header">
                        <h4>{score.criterion}</h4>
                        <span>{score.score}/{score.maxScore}</span>
                      </div>
                      <p>{score.explanation}</p>
                    </article>
                  ))}
                </div>
              </Card>

              <Card className="workspace-note-card">
                <strong>Action Items</strong>
                <div className="checklist-list">
                  {(reviewResult.checklist || []).map((item, index) => (
                    <label key={`${item.item}-${index}`} className="checklist-item">
                      <input type="checkbox" defaultChecked={item.completed} />
                      <span>{item.item}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </Section>
          ) : (
            <Section className="workspace-sidebar-card workspace-sidebar-card--ready">
              <div className="ready-review-card">
                <div className="ready-review-card__art">
                  <Icon name="clipboard-check" />
                </div>
                <h3>Ready to review</h3>
                <p>Once all steps are completed, you can start the AI review.</p>
              </div>
              <div className="ready-review-meta">
                <span>{completionCount}/4 steps complete</span>
                <span>{style} Style</span>
              </div>
            </Section>
          )}
        </aside>
      </div>
    </main>
  );
}

function UploadStepCard({ step, document, rubricName, criteriaCount, busy, onClick }) {
  const isDocument = step.key === "document";
  const hasValue = isDocument ? Boolean(document) : Boolean(rubricName);
  const detailTitle = isDocument ? document?.fileName : rubricName;
  const detailMeta = isDocument
    ? `${document?.structure?.wordCount || 0} words • ${formatBytes(document?.size || 0)}`
    : `${criteriaCount} evaluation points active`;

  return (
    <Card className="review-step-card" role="listitem">
      <StepBadge number={step.number} />
      <div className={`review-step-card__icon review-step-card__icon--${step.key}`}>
        <Icon name={step.icon} />
      </div>
      <div className="review-step-card__content">
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        <div className="review-step-card__upload">
          {hasValue ? (
            <div className="review-step-card__file">
              <strong>{detailTitle}</strong>
              <span>{detailMeta}</span>
            </div>
          ) : (
            <p className="review-step-card__empty">{step.empty}</p>
          )}
          <Button variant="primary" icon={<Icon name={step.icon} />} onClick={onClick} fullWidth disabled={busy}>
            {busy ? "Uploading..." : step.action}
          </Button>
          <div className="review-step-card__meta">
            <span>{step.accepts}</span>
            <span>{step.limit}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function StepBadge({ number }) {
  return <div className="step-badge">{number}</div>;
}

function parseRubricCriteria(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const [name, maxScore] = line.split(":").map((part) => part.trim());
      return {
        name: name || "Criterion",
        maxScore: Number(maxScore) > 0 ? Number(maxScore) : 10,
        description: line,
      };
    });
}

function overallScore(scores) {
  if (!Array.isArray(scores) || !scores.length) return 0;
  const ratio = scores.reduce((sum, item) => sum + item.score / Math.max(item.maxScore, 1), 0) / scores.length;
  return Math.round(ratio * 100);
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
