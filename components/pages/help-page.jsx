"use client";

import { useEffect, useState } from "react";
import { FeaturePage } from "@/components/pages/feature-page";

export function HelpClientPage() {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/v1/help");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message || "Unable to load help");
        setState({ status: "idle", data: payload, error: "" });
      } catch (error) {
        setState({ status: "idle", data: null, error: error.message });
      }
    }
    load();
  }, []);

  return (
    <FeaturePage title="Help & Support" description="Find answers and contact support." primaryHref="/dashboard" primaryLabel="Dashboard">
      <section className="help-grid">
        <article className="panel">
          <h2>FAQ</h2>
          {state.status === "loading" && <p>Loading help topics...</p>}
          {state.error && <p className="error-text">{state.error}</p>}
          {state.data?.faq.map((item) => (
            <div className="faq-item" key={item.question}>
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
            </div>
          ))}
        </article>
        <article className="panel contact-card">
          <h2>Contact Support</h2>
          <p>Still need help? Our support team is here for you.</p>
          <strong>Email Support</strong>
          <span>{state.data?.contact.email || "support@smartreview.ai"}</span>
          <strong>Live Chat</strong>
          <span>{state.data?.contact.availability || "Available 24/7"}</span>
        </article>
      </section>
    </FeaturePage>
  );
}
