import { Link } from "@tanstack/react-router";
import { buttonClasses } from "@/components/ui/button";

export function FeaturePage({ title, description, primaryHref = "/dashboard", primaryLabel = "Start Review", children }) {
  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Link className={buttonClasses({ variant: "primary", size: "md" })} to={primaryHref}>{primaryLabel}</Link>
      </section>
      {children || (
        <section className="panel page-panel">
          <h2>{title}</h2>
          <p>{description}</p>
        </section>
      )}
    </main>
  );
}
