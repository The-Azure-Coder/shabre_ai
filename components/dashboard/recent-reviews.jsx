import { Icon } from "@/lib/icons";
import { Link } from "@tanstack/react-router";

export function RecentReviews({ reviews = [] }) {
  return (
    <section className="recent-card">
      <div className="panel-heading">
        <h2>Recent Reviews</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/reviews">View all</Link>
          <Link to="/reviews/workspace" className="primary-link" style={{ minHeight: '36px', height: '36px', padding: '0 16px', fontSize: '13px' }}>Start New Review</Link>
        </div>
      </div>
      <div className="review-list">
        {!reviews.length && <p className="empty-state">No reviews yet. Upload an assignment to create your first report.</p>}
        {reviews.map((review) => {
          const kind = fileKind(review.mime, review.fileName);
          return (
          <article className="review-row" key={review.reviewId}>
            <span className={`file-badge ${kind}`}>{kind.toUpperCase()}</span>
            <div className="review-copy">
              <strong>{review.fileName}</strong>
              <small>{formatDate(review.createdAt)} | {formatBytes(review.size)}</small>
            </div>
            <mark>{review.score}%</mark>
            <Link className="report-link" to={`/reviews/${review.reviewId}`}>
              <span>View Report</span>
              <Icon name="chevron-right" />
            </Link>
          </article>
        );})}
      </div>
    </section>
  );
}

function fileKind(mime, fileName) {
  if (mime?.includes("pdf") || fileName?.endsWith(".pdf")) return "pdf";
  if (mime?.includes("presentation") || fileName?.endsWith(".pptx")) return "ppt";
  if (mime?.includes("text") || fileName?.endsWith(".txt")) return "txt";
  return "doc";
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatBytes(value = 0) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
