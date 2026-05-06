import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

export function AuthForm({ mode }) {
  const navigate = useNavigate();
  const isSignup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("loading");

    const response = await fetch(`/api/v1/auth/${isSignup ? "signup" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isSignup ? form : { email: form.email, password: form.password }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error?.message || "Authentication failed");
      setStatus("idle");
      return;
    }

    window.localStorage.setItem("smartreview-token", payload.accessToken);
    window.localStorage.setItem("smartreview-user", JSON.stringify(payload.user));
    navigate({ to: "/dashboard" });
  }

  function updateField(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  function MailIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    );
  }

  function LockIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 118 0v3" />
      </svg>
    );
  }

  function UserIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21a8 8 0 00-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    );
  }

  function SparkIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
        <path d="M18 3v3" />
        <path d="M3 18h3" />
      </svg>
    );
  }

  function ShieldIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.9-2.9 8.8-7 10-4.1-1.2-7-5.1-7-10V6l7-3z" />
      </svg>
    );
  }

  function BoltIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" />
      </svg>
    );
  }

  function EyeIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  function EyeOffIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.7a2.5 2.5 0 003.5 3.5" />
        <path d="M9.9 5.1A10.9 10.9 0 0112 5c6.4 0 10 7 10 7a19.5 19.5 0 01-4 4.9" />
        <path d="M6.6 6.7C3.8 8.5 2 12 2 12a19.1 19.1 0 004.9 5.6" />
        <path d="M14.1 14.1A2.5 2.5 0 019.9 9.9" />
      </svg>
    );
  }

  function ArrowIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="M13 5l7 7-7 7" />
      </svg>
    );
  }

  function GoogleIcon() {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.69-.06-1.2-.19-1.73H12v3.26h5.52c-.11.81-.69 2.03-1.98 2.85l-.02.11 2.88 2.23.2.02c1.86-1.71 3-4.22 3-6.74z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.15-2.44c-.84.58-1.97.99-3.47.99-2.64 0-4.88-1.73-5.68-4.13l-.1.01-3 2.31-.03.1A9.99 9.99 0 0012 22z" />
        <path fill="#FBBC05" d="M6.32 14c-.21-.61-.33-1.27-.33-1.95s.12-1.34.32-1.95l-.01-.13-3.03-2.35-.1.05A10 10 0 002 12.05c0 1.61.38 3.13 1.06 4.47L6.32 14z" />
        <path fill="#EA4335" d="M12 5.87c1.89 0 3.17.81 3.9 1.49l2.84-2.77C16.95 2.95 14.7 2 12 2 8.09 2 4.71 4.22 3.06 7.53L6.3 10.03c.81-2.4 3.04-4.16 5.7-4.16z" />
      </svg>
    );
  }

  function MicrosoftIcon() {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#F25022" d="M3 3h8v8H3z" />
        <path fill="#7FBA00" d="M13 3h8v8h-8z" />
        <path fill="#00A4EF" d="M3 13h8v8H3z" />
        <path fill="#FFB900" d="M13 13h8v8h-8z" />
      </svg>
    );
  }

  function AppleIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15.2 4.4c.8-1 1.3-2.2 1.2-3.4-1.1.1-2.4.8-3.2 1.8-.7.8-1.3 2.1-1.1 3.3 1.2.1 2.4-.6 3.1-1.7zM18.2 12.7c0-2.3 1.9-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.2-2.8.9-3.6.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.3.9 1.3 1.9 2.8 3.3 2.7 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.5-2.9 1.5-3-.1 0-3.6-1.4-3.6-4.5z" />
      </svg>
    );
  }

  const features = [
    { icon: <SparkIcon />, title: "AI-Powered Feedback", text: "Get intelligent, contextual feedback." },
    { icon: <ShieldIcon />, title: "Secure & Private", text: "Your data is encrypted and safe." },
    { icon: <BoltIcon />, title: "Save Time", text: "Automate reviews and improve faster." },
  ];

  const shellClassName = `auth-page auth-page--login${isSignup ? " auth-page--signup" : ""}`;
  const intro = isSignup
    ? {
        kicker: "Create your academic workspace",
        titleLead: "Start smarter.",
        titleAccent: "Review better.",
        description: "Build your SmartReview AI account and keep every review, rubric, and improvement flow in one place.",
        heading: "Create account",
        subheading: "Join SmartReview AI and start reviewing with structure.",
        submitLabel: "Create Account",
        dividerLabel: "or create with",
        footerLink: "Sign in",
        footerTo: "/login",
      }
    : {
        kicker: "Welcome to better academic reviews",
        titleLead: "Review smarter.",
        titleAccent: "Write better.",
        description: "AI-powered reviews and insights to elevate your academic work.",
        heading: "Welcome back",
        subheading: "Sign in to continue to SmartReview AI",
        submitLabel: "Sign In",
        dividerLabel: "or continue with",
        footerLink: "Sign up",
        footerTo: "/signup",
      };

  return (
    <main className={shellClassName}>
      <section className="auth-shell">
        <div className="auth-showcase">
          <div className="auth-orbit auth-orbit--large" aria-hidden="true" />
          <div className="auth-orbit auth-orbit--small" aria-hidden="true" />
          <div className="auth-brand">
            <div className="brand-mark auth-brand-mark">SR</div>
            <div>
              <strong>SmartReview <span>AI</span></strong>
            </div>
          </div>
          <div className="auth-copy">
            <p className="auth-kicker">{intro.kicker}</p>
            <h1>{intro.titleLead} <span>{intro.titleAccent}</span></h1>
            <p>{intro.description}</p>
          </div>
          <div className="auth-feature-list">
            {features.map((feature) => (
              <article key={feature.title} className="auth-feature">
                <div className="auth-feature-icon">{feature.icon}</div>
                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-window">
              <div className="auth-preview-toolbar">
                <span />
                <span />
                <span />
              </div>
              <div className="auth-preview-grid">
                <div className="auth-preview-chart">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="auth-preview-panel">
                  <div className="auth-preview-line auth-preview-line--short" />
                  <div className="auth-preview-line" />
                  <div className="auth-preview-pill" />
                  <div className="auth-preview-line auth-preview-line--mid" />
                </div>
              </div>
            </div>
            <div className="auth-preview-card">
              <div className="auth-preview-check" />
              <div className="auth-preview-line auth-preview-line--mid" />
              <div className="auth-preview-line auth-preview-line--short" />
            </div>
          </div>
        </div>

        <form className="auth-panel" onSubmit={submit}>
          <header className="auth-panel-header">
            <h2>{intro.heading}</h2>
            <p>{intro.subheading}</p>
          </header>

          {isSignup && (
            <label className="auth-field">
              <span>Name</span>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><UserIcon /></span>
                <input type="text" placeholder="Enter your full name" value={form.name} onChange={updateField("name")} required minLength={2} />
              </div>
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><MailIcon /></span>
              <input type="email" placeholder="Enter your email" value={form.email} onChange={updateField("email")} required />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><LockIcon /></span>
              <input type={showPassword ? "text" : "password"} placeholder={isSignup ? "Create a secure password" : "Enter your password"} value={form.password} onChange={updateField("password")} required minLength={isSignup ? 8 : 1} />
              <button
                type="button"
                className="auth-input-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          {isSignup ? (
            <p className="auth-support-copy">Use at least 8 characters so your account stays protected.</p>
          ) : (
            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <Link to="/help" className="auth-inline-link">Forgot password?</Link>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="auth-submit" type="submit" disabled={status === "loading"}>
            {status === "loading" && <span className="button-spinner" aria-hidden="true" />}
            <span>{status === "loading" ? "Working..." : intro.submitLabel}</span>
            <span className="auth-submit-icon" aria-hidden="true"><ArrowIcon /></span>
          </button>

          <div className="auth-divider"><span>{intro.dividerLabel}</span></div>

          <div className="auth-socials" aria-label="Social authentication options">
            <button type="button" className="auth-social-button" disabled>
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button type="button" className="auth-social-button" disabled>
              <MicrosoftIcon />
              <span>Microsoft</span>
            </button>
            <button type="button" className="auth-social-button" disabled>
              <AppleIcon />
              <span>Apple</span>
            </button>
          </div>

          <footer className="auth-footer">
            <span>{isSignup ? "Already have an account?" : "Don't have an account?"}</span>
            <Link to={intro.footerTo}>{intro.footerLink}</Link>
          </footer>
        </form>
      </section>
    </main>
  );
}
