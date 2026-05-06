function joinClasses(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className = "" } = {}) {
  return joinClasses(
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth ? "ui-button--full" : "",
    className,
  );
}

export function Button({
  as,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  iconRight,
  className = "",
  children,
  type = "button",
  ...props
}) {
  const Component = as || "button";

  return (
    <Component
      type={Component === "button" ? type : undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {icon ? <span className="ui-button__icon" aria-hidden="true">{icon}</span> : null}
      <span className="ui-button__label">{children}</span>
      {iconRight ? <span className="ui-button__icon" aria-hidden="true">{iconRight}</span> : null}
    </Component>
  );
}
