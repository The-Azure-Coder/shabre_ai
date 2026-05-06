import { Icon } from "@/lib/icons";

export function StatsCards({ stats }) {
  const items = [
    ["Documents Reviewed", String(stats?.documentsReviewed || 0), "Uploaded documents", "document", "purple"],
    ["Reviews Completed", String(stats?.reviewsCompleted || 0), "Completed reviews", "shield", "green"],
    ["Average Score", stats?.averageScore ? `${stats.averageScore}/5` : "0/5", "Out of 5", "star", "amber"],
    ["AI Credits Left", String(stats?.aiCreditsLeft || 0), `${stats?.aiCreditsTotal ? Math.round((stats.aiCreditsLeft / stats.aiCreditsTotal) * 100) : 0}% of ${stats?.aiCreditsTotal || 0}`, "star", "blue"],
  ];
  return (
    <section className="stats-grid" aria-label="Review statistics">
      {items.map(([label, value, detail, icon, tone]) => (
        <article className={`stat-card${label === "AI Credits Left" ? " stat-card-meter" : ""}`} key={label}>
          <span className={`icon-tile ${tone}`}><Icon name={icon} /></span>
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
            {label === "AI Credits Left" ? <div className="meter stat-meter"><i style={{ width: `${stats?.aiCreditsTotal ? Math.round((stats.aiCreditsLeft / stats.aiCreditsTotal) * 100) : 0}%` }} /></div> : null}
          </div>
        </article>
      ))}
    </section>
  );
}
