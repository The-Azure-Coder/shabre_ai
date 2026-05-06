import { Link } from "@tanstack/react-router";
import { Icon } from "@/lib/icons";
import { aiTools } from "@/lib/demo-data";

export function ToolsGrid() {
  const primaryTools = aiTools.slice(0, 6);

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Quick Access</h2>
        <Link to="/utilities">View all</Link>
      </div>
      <div className="tools-grid">
        {primaryTools.map(([title, icon, tone, href]) => (
          <Link className="tool-tile" to={href} key={title}>
            <span className={`icon-tile ${tone}`}><Icon name={icon} /></span>
            <strong>{title}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
