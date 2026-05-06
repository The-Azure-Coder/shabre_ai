import { useRef } from "react";
import Link from "next/link";
import { Icon } from "@/lib/icons";
import { DocumentPreview } from "@/components/document/document-preview";
import { quickActions } from "@/lib/demo-data";
import { validateUploadFile } from "@/lib/upload-constraints";

export function UploadCard({ onFile, onReview, status, error, progressText, review, uploadedDocument }) {
  const inputRef = useRef(null);

  function onChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateUploadFile(file);
      if (validationError) {
        onFile(null, validationError);
        return;
      }
      onFile(file);
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <section className="upload-card">
      <div className="upload-grid">
        {!uploadedDocument ? (
          <div className="drop-zone" onClick={openPicker}>
            <input ref={inputRef} id="assignment-upload" type="file" accept=".pdf,.docx,.txt,.pptx" onChange={onChange} hidden />
            <span className="upload-icon"><Icon name="upload" /></span>
            <div className="drop-zone-label">
              <strong>Drag & drop your file here, or <em>click to upload</em></strong>
              <small>PDF, DOCX, TXT, PPTX (Max 50MB)</small>
            </div>
            {status.state === "uploading" ? (
              <div className="upload-progress-inline">
                <span>{status.message}</span>
                <progress value={status.progress} max="100" />
              </div>
            ) : (
              <button type="button" onClick={(e) => { e.stopPropagation(); openPicker(); }}>Upload File</button>
            )}
          </div>
        ) : (
          <div className="text-preview">
            <div className="panel-heading">
              <h3>{uploadedDocument.fileName}</h3>
              <div className="preview-actions">
                <button type="button" className="secondary" onClick={() => onFile(null)}>Change File</button>
                <button type="button" onClick={onReview} disabled={status.state === "reviewing"}>
                  {status.state === "reviewing" ? "Reviewing..." : "Run Review"}
                </button>
              </div>
            </div>
            <h4>Extracted Text Preview</h4>
            <DocumentPreview document={uploadedDocument} />
          </div>
        )}
        <div className="quick-actions">
          <h3>Try our AI tools</h3>
          {quickActions.map(([title, detail, icon, tone, href]) => (
            <Link href={href} key={title}>
              <span className={`icon-tile ${tone}`}><Icon name={icon} /></span>
              <span><strong>{title}</strong><small>{detail}</small></span>
            </Link>
          ))}
        </div>
      </div>

      {(status.state !== "idle" || error) && !review && (
        <div className={`pipeline-status ${status.state}`}>
          <div>
            <strong>{progressText}</strong>
            {error && <span className="error-text">{error}</span>}
          </div>
          <progress value={status.progress} max="100" />
        </div>
      )}

      {review && (
        <div className="review-complete-strip">
          <div className="status-badge success">
            <Icon name="shield" />
            <span>Review Complete!</span>
          </div>
          <p>{review.summary}</p>
          <div className="review-preview">
            {review.suggestions.slice(0, 3).map((item) => (
              <article key={`${item.type}-${item.location.paragraph}`}>
                <strong>{item.type}</strong>
                <p>{item.suggestion}</p>
              </article>
            ))}
          </div>
          <Link href={`/reviews/${review.reviewId}`} className="primary-link">View Full Report</Link>
        </div>
      )}
    </section>
  );
}
