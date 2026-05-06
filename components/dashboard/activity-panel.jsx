import Link from "next/link";
import { Icon } from "@/lib/icons";

export function ActivityPanel({ activity = [] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Recent Activity</h2>
        <Link href="/reviews">View all</Link>
      </div>
      <div className="activity-list">
        {!activity.length && <p className="empty-state">No recent activity yet.</p>}
        {activity.map((item) => (
          <article key={item.id}>
            <span className="icon-tile green"><Icon name="pencil" /></span>
            <div><strong>{item.title}</strong><small>{formatDate(item.createdAt)}</small></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
