"use client";

import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/surfaces";
import { Icon } from "@/lib/icons";

function authToken() {
  return window.localStorage.getItem("smartreview-token");
}

async function postCitation(payload) {
  const token = authToken();
  if (!token) throw new Error("Sign in before using citation tools.");

  const response = await fetch("/api/v1/tools/citations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Citation request failed");
  return data;
}

const sourceTypes = [
  { value: "website", label: "Website" },
  { value: "article", label: "Article" },
  { value: "book", label: "Book" },
];

const styles = ["APA", "MLA"];

export function CitationGeneratorPage() {
  const [mode, setMode] = useState("automatic");
  const [form, setForm] = useState({
    sourceType: "website",
    style: "APA",
    title: "",
    author: "",
    year: "",
    publisher: "",
    url: "",
    websiteName: "",
  });
  const [result, setResult] = useState({ state: "idle", data: null, error: "" });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function runCitation(payload) {
    setResult({ state: "loading", data: null, error: "" });
    try {
      const data = await postCitation(payload);
      setResult({ state: "idle", data, error: "" });
    } catch (error) {
      setResult({ state: "idle", data: null, error: error.message });
    }
  }

  async function submitAutomatic(event) {
    event.preventDefault();
    await runCitation({
      sourceType: "website",
      style: form.style,
      title: "",
      author: "",
      year: "",
      publisher: "",
      url: form.url,
    });
  }

  async function submitManual(event) {
    event.preventDefault();
    await runCitation({
      sourceType: form.sourceType,
      style: form.style,
      title: form.title,
      author: form.author,
      year: form.year,
      publisher: form.publisher || form.websiteName,
      url: form.url,
    });
  }

  function clearManual() {
    setForm((current) => ({
      ...current,
      sourceType: "website",
      title: "",
      author: "",
      year: "",
      publisher: "",
      url: "",
      websiteName: "",
    }));
    setResult({ state: "idle", data: null, error: "" });
  }

  return (
    <main className="workspace-screen">
      <div className="workspace-screen__container workspace-screen__container--full">
        <Section
          className="workspace-title-block"
          title="Citation Generator"
          description="Create accurate APA or MLA citations from source details or a link."
        />

        <Section
          className="citation-shell"
          actions={(
            <button type="button" className={buttonClasses({ variant: "ghost", size: "md" })}>
              <Icon name="book-open" />
              <span>Citation Guide</span>
            </button>
          )}
        >
          <div className="citation-tabs" role="tablist" aria-label="Citation generator mode">
            <button
              type="button"
              className={`citation-tab${mode === "automatic" ? " is-active" : ""}`}
              onClick={() => setMode("automatic")}
            >
              <span className="citation-tab__icon"><Icon name="link-2" /></span>
              <span className="citation-tab__copy">
                <strong>Automatic (URL)</strong>
                <span>Generate citation from a link</span>
              </span>
            </button>
            <button
              type="button"
              className={`citation-tab${mode === "manual" ? " is-active" : ""}`}
              onClick={() => setMode("manual")}
            >
              <span className="citation-tab__icon"><Icon name="pencil" /></span>
              <span className="citation-tab__copy">
                <strong>Manual Entry</strong>
                <span>Fill in the source details</span>
              </span>
            </button>
          </div>

          {mode === "automatic" ? (
            <form className="citation-auto-panel" onSubmit={submitAutomatic}>
              <div className="citation-panel-copy">
                <h2>Generate from a link</h2>
                <p>Paste a URL below and we&apos;ll extract the details and create the citation for you.</p>
              </div>

              <div className="citation-auto-row">
                <label className="citation-input-wrap citation-input-wrap--url">
                  <Icon name="link-2" />
                  <input
                    type="url"
                    value={form.url}
                    onChange={(event) => update("url", event.target.value)}
                    placeholder="Paste URL (e.g., https://example.com/article)"
                    required
                  />
                </label>
                <Button type="submit" className="citation-primary-button" disabled={result.state === "loading"}>
                  <Icon name="sparkles" />
                  <span>{result.state === "loading" ? "Working..." : "Generate Citation"}</span>
                </Button>
              </div>

              <div className="citation-hint">
                <Icon name="info" />
                <span>Works with websites, articles, journals, books, and more.</span>
              </div>
              {result.error ? <p className="error-text">{result.error}</p> : null}
            </form>
          ) : null}

          <div className="citation-divider" aria-hidden="true">
            <span>OR</span>
          </div>

          <form className="citation-manual-panel" onSubmit={submitManual}>
            <div className="citation-manual-header">
              <div className="citation-panel-copy">
                <h2>Manual entry</h2>
                <p>Enter the source information manually to generate your citation.</p>
              </div>
              <label className="citation-style-select">
                <span>Citation Style</span>
                <span className="settings-select-wrap">
                  <select value={form.style} onChange={(event) => update("style", event.target.value)}>
                    {styles.map((style) => (
                      <option key={style} value={style}>{style} ({style === "APA" ? "7th edition" : "9th edition"})</option>
                    ))}
                  </select>
                  <Icon name="chevron-down" />
                </span>
              </label>
            </div>

            <div className="citation-form-grid">
              <label className="citation-field citation-field--wide">
                <span>Source Type</span>
                <span className="settings-select-wrap">
                  <select value={form.sourceType} onChange={(event) => update("sourceType", event.target.value)}>
                    {sourceTypes.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  <Icon name="chevron-down" />
                </span>
              </label>

              <label className="citation-field citation-field--wide">
                <span>Title</span>
                <input type="text" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Enter title of the work" required />
              </label>

              <label className="citation-field">
                <span>Author</span>
                <input type="text" value={form.author} onChange={(event) => update("author", event.target.value)} placeholder="Enter author name" required />
              </label>

              <label className="citation-field citation-field--year">
                <span>Year</span>
                <input type="text" value={form.year} onChange={(event) => update("year", event.target.value)} placeholder="YYYY" required />
              </label>

              <label className="citation-field">
                <span>Publisher</span>
                <input type="text" value={form.publisher} onChange={(event) => update("publisher", event.target.value)} placeholder="Enter publisher name" />
              </label>

              <label className="citation-field citation-field--wide">
                <span>Website / Journal Name</span>
                <input type="text" value={form.websiteName} onChange={(event) => update("websiteName", event.target.value)} placeholder="Enter website or journal name" />
              </label>

              <label className="citation-field citation-field--wide">
                <span>URL</span>
                <label className="citation-input-wrap">
                  <Icon name="link-2" />
                  <input type="url" value={form.url} onChange={(event) => update("url", event.target.value)} placeholder="https://" />
                </label>
              </label>
            </div>

            <button type="button" className="citation-add-field">
              <Icon name="plus-circle" />
              <span>Add another field</span>
            </button>

            <div className="citation-actions">
              <button type="button" className={buttonClasses({ variant: "ghost", size: "md", className: "citation-secondary-button" })} onClick={clearManual}>
                <Icon name="trash" />
                <span>Clear All</span>
              </button>
              <Button type="submit" className="citation-primary-button" disabled={result.state === "loading"}>
                <Icon name="sparkles" />
                <span>{result.state === "loading" ? "Working..." : "Generate Citation"}</span>
              </Button>
            </div>

            {result.error ? <p className="error-text">{result.error}</p> : null}
          </form>
        </Section>

        <Section
          className="citation-history-panel"
          title="Your Citations"
          description={result.data ? "Your most recent generated citation is ready below." : "Your recent generated citations will appear here."}
          actions={(
            <button type="button" className={buttonClasses({ variant: "ghost", size: "md" })}>
              <Icon name="repeat" />
              <span>View History</span>
            </button>
          )}
        >
          {result.data ? (
            <div className="citation-result-card">
              <div className="citation-result-card__header">
                <strong>{result.data.style} Citation</strong>
                <span>{result.data.sourceType}</span>
              </div>
              <p className="citation-output">{result.data.citation}</p>
              {result.data.notes?.length ? (
                <ul className="citation-result-notes">
                  {result.data.notes.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="citation-empty-state">
              <div className="citation-empty-state__icon">
                <Icon name="quote" />
              </div>
              <p>Generate a citation to see it here.</p>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}
