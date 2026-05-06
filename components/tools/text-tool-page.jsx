"use client";

import { useState } from "react";
import { FeaturePage } from "@/components/pages/feature-page";

export function TextToolPage({ title, description, endpoint, mode }) {
  const [text, setText] = useState("");
  const [tone, setTone] = useState("academic");
  const [tool, setTool] = useState(mode === "paraphrase" ? "paraphrase" : mode);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setStatus("loading");

    const token = window.localStorage.getItem("smartreview-token");
    if (!token) {
      setError("Sign in before using writing tools.");
      setStatus("idle");
      return;
    }

    const body = mode === "paraphrase"
      ? { text: tool === "grammar" ? `Fix grammar only: ${text}` : text, tone: tool === "tone" ? tone : "academic", preserveMeaning: true }
      : { text, mode: "short" };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error?.message || "Tool request failed");
      setStatus("idle");
      return;
    }

    setResult(payload);
    setStatus("idle");
  }

  return (
    <FeaturePage title={title} description={description} primaryHref="/dashboard" primaryLabel="Dashboard">
      <form className="tool-form panel" onSubmit={submit}>
        <label>
          Text
          <textarea value={text} onChange={(event) => setText(event.target.value)} required minLength={1} rows={8} />
        </label>
        {mode === "paraphrase" && (
          <label>
            Tool
            <select value={tool} onChange={(event) => setTool(event.target.value)}>
              <option value="paraphrase">Paraphrase</option>
              <option value="grammar">Grammar Fix</option>
              <option value="tone">Tone Adjust</option>
            </select>
          </label>
        )}
        {mode === "paraphrase" && tool === "tone" && (
          <label>
            Tone
            <select value={tone} onChange={(event) => setTone(event.target.value)}>
              <option value="academic">Academic</option>
              <option value="clear">Clear</option>
              <option value="natural">Natural</option>
            </select>
          </label>
        )}
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={status === "loading"}>{status === "loading" ? "Working..." : title}</button>
      </form>
      {result && (
        <section className="panel tool-result">
          <h2>Result</h2>
          {"summary" in result ? <p>{result.summary}</p> : <p>{result.paraphrase}</p>}
          {Array.isArray(result.bullets) && (
            <ul>
              {result.bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {Array.isArray(result.notes) && (
            <ul>
              {result.notes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      )}
    </FeaturePage>
  );
}
