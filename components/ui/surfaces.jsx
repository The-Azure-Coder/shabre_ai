function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className = "", children, ...props }) {
  return (
    <section className={joinClasses("ui-card", className)} {...props}>
      {children}
    </section>
  );
}

export function Section({ className = "", eyebrow, title, description, actions, children, ...props }) {
  return (
    <section className={joinClasses("ui-section", className)} {...props}>
      {(eyebrow || title || description || actions) ? (
        <header className="ui-section__header">
          <div className="ui-section__copy">
            {eyebrow ? <span className="ui-section__eyebrow">{eyebrow}</span> : null}
            {title ? <h2 className="ui-section__title">{title}</h2> : null}
            {description ? <p className="ui-section__description">{description}</p> : null}
          </div>
          {actions ? <div className="ui-section__actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
