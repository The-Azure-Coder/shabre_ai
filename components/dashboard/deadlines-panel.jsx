import Link from "next/link";
import { Icon } from "@/lib/icons";

export function DeadlinesPanel({ deadlines = [] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Upcoming Deadlines</h2>
        <Link href="/dashboard">View all</Link>
      </div>
      <div className="deadline-list">
        {!deadlines.length && <p className="empty-state">No upcoming deadlines.</p>}
        {deadlines.map((item) => (
          <article key={item.id || item.title}>
            <span className="icon-tile amber"><Icon name="notebook" /></span>
            <div><strong>{item.title}</strong><small>{item.date}</small></div>
            <em>{item.left}</em>
          </article>
        ))}
      </div>
    </section>
  );
}
