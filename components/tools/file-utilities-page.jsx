"use client";

import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/surfaces";
import { Icon } from "@/lib/icons";

const smartTools = [
  {
    title: "Summarizer",
    description: "Create concise summaries and bullet lists.",
    href: "/summarizer",
    icon: "notebook",
    accent: "violet",
  },
  {
    title: "Paraphraser",
    description: "Rewrite text in academic, clear, or natural tone.",
    href: "/writing-tools",
    icon: "pencil",
    accent: "emerald",
  },
  {
    title: "Citation Generator",
    description: "Generate APA and MLA citations from sources.",
    href: "/citations",
    icon: "quote",
    accent: "blue",
  },
  {
    title: "Formatting Checker",
    description: "Find and fix APA, MLA, or custom formatting issues.",
    href: "/formatting",
    icon: "scan-text",
    accent: "amber",
  },
];

const fileUtilities = [
  {
    title: "DOCX to PDF",
    description: "Convert Word documents (DOCX) into high-quality PDF files.",
    endpoint: "/api/v1/utilities/docx-to-pdf",
    fieldName: "file",
    accept: ".docx",
    multiple: false,
    buttonLabel: "Convert to PDF",
    icon: "file-text",
    accent: "violet",
  },
  {
    title: "Merge PDFs",
    description: "Combine two or more PDF files into one complete document.",
    endpoint: "/api/v1/utilities/pdf/merge",
    fieldName: "files",
    accept: ".pdf",
    multiple: true,
    buttonLabel: "Merge PDFs",
    icon: "file",
    accent: "emerald",
  },
  {
    title: "Split PDF",
    description: "Split a PDF into multiple files or extract specific pages.",
    endpoint: "/api/v1/utilities/pdf/split",
    fieldName: "file",
    accept: ".pdf",
    multiple: false,
    buttonLabel: "Split PDF",
    icon: "document",
    accent: "blue",
  },
];

export function FileUtilitiesPage() {
  return (
    <main className="workspace-screen">
      <div className="workspace-screen__container workspace-screen__container--full">
        <Section
          className="utilities-hero"
          eyebrow="Utilities Hub"
          title="All your academic tools in one place"
          description="Convert, merge, split, and enhance your documents with powerful AI utilities."
          actions={(
            <Link
              className={buttonClasses({ variant: "primary", size: "md", className: "utilities-hero__action" })}
              to="/summarizer"
            >
              <Icon name="sparkles" />
              <span>Open Summarizer</span>
            </Link>
          )}
        >
          <div className="utilities-hero__art" aria-hidden="true">
            <div className="utilities-hero__cluster">
              <span className="utilities-hero__spark utilities-hero__spark--one" />
              <span className="utilities-hero__spark utilities-hero__spark--two" />
              <span className="utilities-hero__spark utilities-hero__spark--three" />
              <div className="utilities-hero__tile utilities-hero__tile--main">
                <Icon name="grid" />
              </div>
              <div className="utilities-hero__tile utilities-hero__tile--doc">
                <Icon name="file" />
              </div>
              <div className="utilities-hero__tile utilities-hero__tile--format">
                <Icon name="scan-text" />
              </div>
              <div className="utilities-hero__tile utilities-hero__tile--note">
                <Icon name="notebook" />
              </div>
              <div className="utilities-hero__line utilities-hero__line--one" />
              <div className="utilities-hero__line utilities-hero__line--two" />
            </div>
          </div>
        </Section>

        <Section
          className="utilities-section"
          title="Smart Tools"
          description="AI-powered tools to enhance your writing and research."
        >
          <div className="utilities-smart-grid">
            {smartTools.map((tool) => (
              <Link key={tool.title} className={`utilities-smart-card utilities-smart-card--${tool.accent}`} to={tool.href}>
                <div className="utilities-smart-card__icon">
                  <Icon name={tool.icon} />
                </div>
                <div className="utilities-smart-card__copy">
                  <strong>{tool.title}</strong>
                  <span>{tool.description}</span>
                </div>
                <div className="utilities-smart-card__arrow">
                  <Icon name="chevron-right" />
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          className="utilities-section"
          title="File Utilities"
          description="Convert, merge, split and manage your files easily."
        >
          <div className="utilities-file-grid">
            {fileUtilities.map((utility) => (
              <FileUtilityForm key={utility.title} {...utility} />
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function FileUtilityForm({ title, description, endpoint, fieldName, accept, multiple, buttonLabel, icon, accent }) {
  const inputId = useId();
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("loading");

    const token = window.localStorage.getItem("smartreview-token");
    if (!token) {
      setError("Sign in before using file utilities.");
      setStatus("idle");
      return;
    }

    try {
      const form = new FormData();
      for (const file of files) form.append(fieldName, file);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error?.message || "File utility failed");
      }

      const blob = await response.blob();
      const fileName = fileNameFromDisposition(response.headers.get("content-disposition")) || defaultFileName(title);
      downloadBlob(blob, fileName);
      setStatus("complete");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  return (
    <Card className={`utilities-file-card utilities-file-card--${accent}`}>
      <form className="utilities-file-card__form" onSubmit={submit}>
        <div className="utilities-file-card__art" aria-hidden="true">
          <div className="utilities-file-card__file utilities-file-card__file--left">
            <Icon name={icon} />
          </div>
          <div className="utilities-file-card__flow" />
          <div className="utilities-file-card__file utilities-file-card__file--middle">
            <span>PDF</span>
          </div>
          <div className="utilities-file-card__flow utilities-file-card__flow--second" />
          <div className="utilities-file-card__file utilities-file-card__file--right">
            {title.includes("Merge") ? <span>X</span> : title.includes("Split") ? <Icon name="notebook" /> : <span>PDF</span>}
          </div>
        </div>

        <div className="utilities-file-card__copy">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <label className="utilities-upload" htmlFor={inputId}>
          <span className="utilities-upload__button">
            <Icon name="upload" />
            <span>Choose File{multiple ? "s" : ""}</span>
          </span>
          <span className="utilities-upload__name">
            {files.length
              ? files.map((file) => file.name).join(", ")
              : "No file chosen"}
          </span>
        </label>

        <input
          id={inputId}
          className="utilities-upload__input"
          type="file"
          accept={accept}
          multiple={multiple}
          required
          onChange={(event) => {
            setFiles(Array.from(event.target.files || []));
            setStatus("idle");
            setError("");
          }}
        />

        {error ? <p className="error-text">{error}</p> : null}
        {status === "complete" ? <p className="success-text">Download ready.</p> : null}

        <Button
          type="submit"
          fullWidth
          className={`utilities-file-card__submit utilities-file-card__submit--${accent}`}
          disabled={status === "loading" || files.length === 0}
        >
          {status === "loading" ? "Working..." : buttonLabel}
        </Button>
      </form>
    </Card>
  );
}

function fileNameFromDisposition(disposition) {
  return disposition?.match(/filename="([^"]+)"/)?.[1] || "";
}

function defaultFileName(title) {
  if (title.includes("Merge")) return "merged.pdf";
  if (title.includes("Split")) return "pages.zip";
  return "converted.pdf";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
