"use client";

import { useEffect, useState } from "react";
import { FeaturePage } from "@/components/pages/feature-page";

function authToken() {
  return window.localStorage.getItem("smartreview-token");
}

async function postTool(endpoint, payload) {
  const token = authToken();
  if (!token) throw new Error("Sign in before using this tool.");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Tool request failed");
  return data;
}

export function FormattingToolPage() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState("APA");
  const [customRules, setCustomRules] = useState("");
  const [result, setResult] = useToolState();

  async function submit(event) {
    event.preventDefault();
    await setResult(() => postTool("/api/v1/tools/formatting", { text, style, customRules }));
  }

  return (
    <FeaturePage title="Formatting Checker" description="Check assignment structure against APA, MLA, or custom formatting rules.">
      <form className="tool-form panel compact-form" onSubmit={submit}>
        <div className="field-row">
          <label>
            Style
            <select value={style} onChange={(event) => setStyle(event.target.value)}>
              <option value="APA">APA</option>
              <option value="MLA">MLA</option>
              <option value="Custom">Custom</option>
            </select>
          </label>
          {style === "Custom" && (
            <label>
              Custom Rules
              <input value={customRules} onChange={(event) => setCustomRules(event.target.value)} placeholder="Example: title page, 12pt font, numbered headings" />
            </label>
          )}
        </div>
        <TextArea value={text} onChange={setText} label="Assignment Text" />
        <SubmitButton state={result.state} label="Check Formatting" />
        <StatusMessage result={result} />
      </form>
      {result.data && (
        <section className="panel tool-result">
          <h2>Violations</h2>
          {result.data.violations.length ? (
            <div className="result-list">
              {result.data.violations.map((item) => (
                <article key={`${item.location}-${item.message}`}>
                  <strong>{item.location}</strong>
                  <span>{item.severity}</span>
                  <p>{item.message}</p>
                </article>
              ))}
            </div>
          ) : <p>No likely formatting violations found.</p>}
          <small>{result.data.disclaimer}</small>
        </section>
      )}
    </FeaturePage>
  );
}

export function AiDetectorToolPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useToolState();

  async function submit(event) {
    event.preventDefault();
    await setResult(() => postTool("/api/v1/tools/ai-detect", { text }));
  }

  return (
    <FeaturePage title="AI Detector" description="Estimate robotic writing signals and highlight sections that deserve a closer review.">
      <form className="tool-form panel compact-form" onSubmit={submit}>
        <TextArea value={text} onChange={setText} label="Text to Check" minLength={40} />
        <SubmitButton state={result.state} label="Check Text" />
        <StatusMessage result={result} />
      </form>
      {result.data && (
        <section className="panel tool-result">
          <div className="score-strip">
            <strong>{result.data.probability}%</strong>
            <span>{result.data.label} AI-likeness signal</span>
          </div>
          <h2>Highlighted Sections</h2>
          {result.data.highlightedSections.length ? (
            <div className="result-list">
              {result.data.highlightedSections.map((item) => (
                <article key={item.text}>
                  <strong>{item.probability}% signal</strong>
                  <p>{item.text}</p>
                  <small>{item.reason}</small>
                </article>
              ))}
            </div>
          ) : <p>No highly suspicious sections were isolated.</p>}
          <small>{result.data.disclaimer}</small>
        </section>
      )}
    </FeaturePage>
  );
}

export function HumanizerToolPage() {
  const [text, setText] = useState("");
  const [tone, setTone] = useState("natural");
  const [result, setResult] = useToolState();

  async function submit(event) {
    event.preventDefault();
    await setResult(() => postTool("/api/v1/tools/humanize", { text, tone }));
  }

  return (
    <FeaturePage title="Humanizer" description="Detect stiff phrasing and rewrite text with a more natural academic voice.">
      <form className="tool-form panel compact-form" onSubmit={submit}>
        <label>
          Tone
          <select value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="natural">Natural</option>
            <option value="academic">Academic</option>
            <option value="clear">Clear</option>
          </select>
        </label>
        <TextArea value={text} onChange={setText} label="Original Text" />
        <SubmitButton state={result.state} label="Humanize Text" />
        <StatusMessage result={result} />
      </form>
      {result.data && (
        <section className="panel tool-result">
          <div className="score-strip">
            <strong>{result.data.roboticTone.score}%</strong>
            <span>{result.data.roboticTone.label} robotic tone signal</span>
          </div>
          <div className="comparison-grid">
            <article>
              <h2>Original</h2>
              <p>{result.data.sideBySide.original}</p>
            </article>
            <article>
              <h2>Rewrite</h2>
              <p>{result.data.sideBySide.rewritten}</p>
            </article>
          </div>
          <ul>
            {result.data.notes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}
    </FeaturePage>
  );
}

export function CitationToolPage() {
  const [form, setForm] = useState({
    sourceType: "website",
    style: "APA",
    title: "",
    author: "",
    year: "",
    publisher: "",
    url: "",
  });
  const [result, setResult] = useToolState();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    await setResult(() => postTool("/api/v1/tools/citations", form));
  }

  return (
    <FeaturePage title="Citation Generator" description="Create a structured APA or MLA citation draft from source details.">
      <form className="tool-form panel compact-form" onSubmit={submit}>
        <div className="field-row">
          <label>
            Style
            <select value={form.style} onChange={(event) => update("style", event.target.value)}>
              <option value="APA">APA</option>
              <option value="MLA">MLA</option>
            </select>
          </label>
          <label>
            Source Type
            <select value={form.sourceType} onChange={(event) => update("sourceType", event.target.value)}>
              <option value="website">Website</option>
              <option value="article">Article</option>
              <option value="book">Book</option>
            </select>
          </label>
        </div>
        <div className="field-row">
          <Input label="Title" value={form.title} onChange={(value) => update("title", value)} />
          <Input label="Author" value={form.author} onChange={(value) => update("author", value)} />
        </div>
        <div className="field-row">
          <Input label="Year" value={form.year} onChange={(value) => update("year", value)} />
          <Input label="Publisher" value={form.publisher} onChange={(value) => update("publisher", value)} required={false} />
        </div>
        <Input label="URL" value={form.url} onChange={(value) => update("url", value)} type="url" required={false} />
        <SubmitButton state={result.state} label="Generate Citation" />
        <StatusMessage result={result} />
      </form>
      {result.data && (
        <section className="panel tool-result">
          <h2>{result.data.style} Citation</h2>
          <p className="citation-output">{result.data.citation}</p>
          <ul>
            {result.data.notes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}
    </FeaturePage>
  );
}

export function RubricToolPage() {
  const [text, setText] = useState("");
  const [rubricText, setRubricText] = useState("Argument: 10\nEvidence: 10\nOrganization: 10");
  const [documents, setDocuments] = useState([]);
  const [result, setResult] = useToolState();

  useEffect(() => {
    async function loadDocuments() {
      const token = authToken();
      if (!token) return;
      const response = await fetch("/api/v1/documents", { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (response.ok) setDocuments(payload.documents || []);
    }
    loadDocuments();
  }, []);

  async function submit(event) {
    event.preventDefault();
    await setResult(() => postTool("/api/v1/tools/rubric", { text, rubricText }));
  }

  return (
    <FeaturePage title="Rubric Evaluations" description="Score assignment text against pasted rubric criteria.">
      <form className="tool-form panel compact-form" onSubmit={submit}>
        <label>
          Document
          <select value="" onChange={(event) => {
            const document = documents.find((item) => item.documentId === event.target.value);
            if (document) setText(document.textPreview || "");
          }}>
            <option value="">Paste text manually or choose a document</option>
            {documents.map((document) => <option value={document.documentId} key={document.documentId}>{document.fileName}</option>)}
          </select>
        </label>
        <TextArea value={text} onChange={setText} label="Assignment Text" />
        <TextArea value={rubricText} onChange={setRubricText} label="Rubric Criteria" rows={4} />
        <SubmitButton state={result.state} label="Evaluate Rubric" />
        <StatusMessage result={result} />
      </form>
      {result.data && (
        <section className="panel tool-result">
          <div className="score-strip">
            <strong>{result.data.total}/{result.data.maxTotal}</strong>
            <span>{result.data.summary}</span>
          </div>
          <div className="result-list">
            {result.data.scores.map((item) => (
              <article key={item.criterion}>
                <strong>{item.criterion}: {item.score}/{item.maxScore}</strong>
                <p>{item.feedback}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </FeaturePage>
  );
}

function useToolState() {
  const [state, setState] = useState({ state: "idle", data: null, error: "" });

  async function run(action) {
    setState({ state: "loading", data: null, error: "" });
    try {
      const data = await action();
      setState({ state: "idle", data, error: "" });
    } catch (error) {
      setState({ state: "idle", data: null, error: error.message });
    }
  }

  return [state, run];
}

function TextArea({ value, onChange, label, rows = 8, minLength = 1 }) {
  return (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} required minLength={minLength} rows={rows} />
    </label>
  );
}

function Input({ label, value, onChange, type = "text", required = true }) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function SubmitButton({ state, label }) {
  return <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Working..." : label}</button>;
}

function StatusMessage({ result }) {
  if (!result.error) return null;
  return <p className="error-text">{result.error}</p>;
}
