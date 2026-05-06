"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { buttonClasses } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/surfaces";
import { demoUser } from "@/lib/demo-data";
import { Icon } from "@/lib/icons";

const accountRows = [
  { label: "Full Name", key: "name", icon: "user", accent: "violet" },
  { label: "Email Address", key: "email", icon: "mail", accent: "blue" },
  { label: "Role", key: "role", icon: "crown", accent: "green" },
  { label: "Password", key: "password", icon: "lock", accent: "amber" },
];

const statusRows = [
  { label: "Member since", value: "May 2024", icon: "calendar", accent: "violet" },
  { label: "Plan", value: "Pro Student", icon: "star", accent: "blue" },
  { label: "Reviews completed", value: "12", icon: "file-text", accent: "green" },
];

export function ProfileWorkspacePage() {
  const [user, setUser] = useState({
    name: demoUser.name,
    email: "student@smartreview.ai",
    role: demoUser.role,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem("smartreview-user");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setUser({
        name: parsed.name || demoUser.name,
        email: parsed.email || "student@smartreview.ai",
        role: parsed.role || demoUser.role || "Student",
      });
    } catch {}
  }, []);

  const initials = useMemo(
    () => (user.name || demoUser.name).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    [user.name],
  );

  return (
    <main className="workspace-screen">
      <div className="workspace-screen__container workspace-screen__container--full">
        <Section
          className="workspace-title-block"
          title="Profile"
          description="Manage your account details and preferences."
          actions={(
            <Link className={buttonClasses({ variant: "primary", size: "md" })} to="/dashboard">
              <Icon name="grid" />
              <span>Go to Dashboard</span>
            </Link>
          )}
        />

        <Card className="profile-hero">
          <div className="profile-hero__identity">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{initials}</div>
              <button type="button" className="profile-avatar-edit" aria-label="Edit profile photo">
                <Icon name="pencil" />
              </button>
            </div>

            <div className="profile-hero__copy">
              <div className="profile-hero__headline">
                <h2>{user.name}</h2>
                <span className="profile-badge">{user.role}</span>
              </div>
              <p className="profile-hero__email">{user.email}</p>
              <p className="profile-hero__summary">
                AI-powered tools to improve your writing and academic performance.
              </p>
            </div>
          </div>

          <div className="profile-hero__art" aria-hidden="true">
            <span className="profile-hero__spark profile-hero__spark--one" />
            <span className="profile-hero__spark profile-hero__spark--two" />
            <span className="profile-hero__spark profile-hero__spark--three" />
            <div className="profile-hero__card">
              <div className="profile-hero__card-avatar" />
              <div className="profile-hero__card-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="profile-hero__shield">
              <Icon name="shield" />
            </div>
          </div>
        </Card>

        <div className="profile-grid">
          <Section className="profile-panel" title="Account Information">
            <div className="profile-info-list">
              {accountRows.map((row) => (
                <div key={row.label} className="profile-info-row">
                  <div className={`profile-info-row__icon profile-info-row__icon--${row.accent}`}>
                    <Icon name={row.icon} />
                  </div>
                  <div className="profile-info-row__content">
                    <span>{row.label}</span>
                    <strong>{formatProfileValue(row.key, user)}</strong>
                  </div>
                  <button type="button" className={buttonClasses({ variant: "ghost", size: "sm", className: "profile-row-action" })}>
                    Edit
                  </button>
                </div>
              ))}
            </div>

            <div className="profile-panel__footer">
              <Link className="profile-inline-link" to="/settings">
                <span>Manage account preferences</span>
                <Icon name="chevron-right" />
              </Link>
            </div>
          </Section>

          <Section className="profile-panel" title="Account Status">
            <div className="profile-status-card">
              {statusRows.map((row) => (
                <div key={row.label} className="profile-status-row">
                  <div className={`profile-status-row__icon profile-status-row__icon--${row.accent}`}>
                    <Icon name={row.icon} />
                  </div>
                  <div className="profile-status-row__content">
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                </div>
              ))}

              <div className="profile-status-row profile-status-row--credits">
                <div className="profile-status-row__icon profile-status-row__icon--amber">
                  <Icon name="star" />
                </div>
                <div className="profile-status-row__content">
                  <span>AI Credits</span>
                  <strong>8.4k / 10k</strong>
                  <div className="profile-progress" aria-hidden="true">
                    <div className="profile-progress__fill" />
                  </div>
                </div>
              </div>
            </div>

            <Link className="profile-upgrade-link" to="/settings">
              <span className="profile-upgrade-link__copy">
                <Icon name="crown" />
                <strong>Upgrade Plan</strong>
              </span>
              <Icon name="chevron-right" />
            </Link>
          </Section>
        </div>

        <Card className="profile-security-card">
          <div className="profile-security-card__icon">
            <Icon name="shield" />
          </div>
          <div className="profile-security-card__copy">
            <h3>Your data is secure</h3>
            <p>We use industry-standard encryption to protect your data and ensure your information is safe.</p>
          </div>
          <Link className={buttonClasses({ variant: "ghost", size: "md" })} to="/help">
            <span>Learn more</span>
            <Icon name="chevron-right" />
          </Link>
        </Card>
      </div>
    </main>
  );
}

function formatProfileValue(key, user) {
  if (key === "email") return user.email || "student@smartreview.ai";
  if (key === "role") return user.role || "Student";
  if (key === "password") return "•••••••••••••";
  return user.name || demoUser.name;
}
