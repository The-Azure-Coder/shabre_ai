import { Link, useLocation } from "@tanstack/react-router";
import { Icon } from "@/lib/icons";
import { navigationGroups } from "@/lib/demo-data";
import { buttonClasses } from "@/components/ui/button";

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-row">
        <div className="brand-mark">SR</div>
        <strong>SmartReview AI</strong>
      </div>

      <div className="sidebar-action">
        <Link className={buttonClasses({ variant: "primary", size: "md", fullWidth: true, className: "sidebar-new-review" })} to="/reviews">
          <Icon name="plus" />
          <span>New Review</span>
        </Link>
      </div>

      <nav>
        {navigationGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map(([label, icon, href]) => (
              <Link className={pathname === href ? "active" : ""} to={href} key={label}>
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="credits-card credits-card--sidebar">
        <div className="credits-card__header">
          <span className="credits-card__label">AI Credits</span>
          <span className="credits-card__value">8.4k / 10k</span>
        </div>
        <div className="meter meter--sidebar" aria-hidden="true">
          <div className="meter__fill meter__fill--sidebar" />
        </div>
      </div>
    </aside>
  );
}
