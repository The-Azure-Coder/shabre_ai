import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { appConfig } from "./config.js";
import { deleteCloudinaryAsset, uploadBufferToCloudinary } from "./cloudinary-service.js";
import { safeFilename, sanitizeText } from "./security.js";
import { prisma } from "./store.js";
import { getFileExtension, uploadConstraints } from "../upload-constraints.js";
import { jobEmitter } from "./realtime-service.js";

const require = createRequire(import.meta.url);

export async function acceptUpload({ file, ownerId }) {
  if (!file || !file.name) {
    validation("VALIDATION_ERROR", "A file is required");
  }

  const name = safeFilename(file.name);
  const extension = getFileExtension(name);
  const mime = file.type || "application/octet-stream";
  const acceptedMimes = uploadConstraints.allowedMimeTypes[extension];

  if (!acceptedMimes || !acceptedMimes.includes(mime)) {
    validation("UNSUPPORTED_FILE_TYPE", "File type is not supported");
  }

  if (file.size <= 0) {
    validation("VALIDATION_ERROR", "File cannot be empty");
  }

  if (file.size > appConfig.uploadMaxBytes) {
    validation("FILE_TOO_LARGE", "File exceeds the configured upload limit");
  }

  const documentId = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const job = await createJob(ownerId, "upload", documentId, "queued", 10, "Upload started");
  const jobId = job.jobId;

  // Process in background
  (async () => {
    try {
      jobEmitter.emitJobProgress(jobId, 30, "Extracting document content");
      const content = await extractDocumentContent(buffer, extension);
      
      jobEmitter.emitJobProgress(jobId, 60, "Normalizing document structure");
      const normalized = normalizeDocument(content.text);
      
      jobEmitter.emitJobProgress(jobId, 80, "Storing document");
      const storage = await storageDescriptor({ buffer, name, mime });
      if (content.html) {
        storage.contentHtml = content.html;
      }
      
      await prisma.document.create({
        data: {
          id: documentId,
          ownerId,
          fileName: name,
          mime,
          size: file.size,
          storage,
          text: normalized.text,
          structure: normalized.structure,
        },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "completed", progress: 100, message: "Upload complete" }
      });

      jobEmitter.emitJobComplete(jobId, `/api/v1/documents/${documentId}`);
    } catch (error) {
      console.error("Background upload processing failed:", error.message);
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "error", error: error.message, message: "Upload failed" }
      });
      jobEmitter.emitJobError(jobId, error.message);
    }
  })();

  return {
    documentId,
    fileName: name,
    mime,
    size: file.size,
    status: "queued",
    pollUrl: `/api/v1/jobs/${jobId}`,
    wsTopic: jobId,
    textPreview: "Processing...",
  };
}

export function normalizeDocument(text) {
  const clean = sanitizeText(text);
  const paragraphs = clean.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const headings = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3 && line.length < 80 && !/[.!?]$/.test(line))
    .slice(0, 6);
  const words = clean.match(/\b[\w'-]+\b/g) || [];

  return {
    text: clean,
    structure: {
      title: headings[0] || "",
      headings,
      paragraphCount: paragraphs.length || (clean ? 1 : 0),
      wordCount: words.length,
      pageCount: 1,
    },
  };
}

export function textToStructuredHtml(text) {
  const clean = sanitizeText(text);
  if (!clean) {
    return '<p class="document-placeholder">No preview available.</p>';
  }

  const blocks = clean.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const html = blocks.map((block, index) => {
    const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
    const heading = index === 0 || (lines.length === 1 && lines[0].length < 90 && !/[.!?]$/.test(lines[0]));
    if (heading) {
      return `<h2>${escapeHtml(lines.join(" "))}</h2>`;
    }

    const bulletLines = lines.every((line) => /^([-*\u2022]|\d+\.)\s+/.test(line));
    if (bulletLines) {
      const items = lines.map((line) => `<li>${escapeHtml(line.replace(/^([-*\u2022]|\d+\.)\s+/, ""))}</li>`).join("");
      return `<ul>${items}</ul>`;
    }

    return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  }).join("");

  return html || `<p>${escapeHtml(clean)}</p>`;
}

export function prepareEditorDocumentContent({ html, text }) {
  const normalizedText = normalizeDocument(text);
  const contentHtml = String(html || "").trim() || textToStructuredHtml(normalizedText.text);

  return {
    text: normalizedText.text,
    structure: normalizedText.structure,
    contentHtml,
  };
}

export async function createJob(ownerId, type, resourceId, status = "completed", progress = 100, message = "") {
  const job = await prisma.job.create({
    data: {
      ownerId,
      type,
      resourceId,
      status,
      progress,
      message: message || (type === "upload" ? "Document parsed" : "Review ready"),
      resultUrl: resourceId ? `/api/v1/${type === "upload" ? "documents" : "reviews"}/${resourceId}` : null,
      error: null,
    },
  });
  return toPublicJob(job);
}

export function toPublicJob(job) {
  return {
    jobId: job.id,
    ownerId: job.ownerId,
    type: job.type,
    resourceId: job.resourceId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    resultUrl: job.resultUrl,
    error: job.error,
  };
}

async function extractDocumentContent(buffer, extension) {
  if (extension === "txt") {
    return { text: buffer.toString("utf8"), html: null };
  }
  if (extension === "pdf") {
    const pdf = require("pdf-parse");
    let parse = typeof pdf === "function" ? pdf : pdf.default;
    if (typeof parse !== "function" && pdf.PDFParse) {
      const parser = new pdf.PDFParse({ data: buffer });
      const result = await parser.getText();
      return { text: result.text, html: null };
    }
    const result = await parse(buffer);
    return { text: result.text, html: null };
  }
  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const api = mammoth.default || mammoth;
    const [textResult, htmlResult] = await Promise.all([
      api.extractRawText({ buffer }),
      api.convertToHtml({ buffer }),
    ]);
    return {
      text: textResult.value,
      html: htmlResult.value,
    };
  }
  if (extension === "pptx") {
    return { text: await extractPptxText(buffer), html: null };
  }
  validation("UNSUPPORTED_FILE_TYPE", "File type is not supported");
}

async function extractPptxText(buffer) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.values(zip.files)
    .filter((file) => /^ppt\/slides\/slide\d+\.xml$/.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const slides = await Promise.all(slideFiles.map((file) => file.async("string")));
  return slides.map(xmlTextFromSlide).filter(Boolean).join("\n\n");
}

function xmlTextFromSlide(xml) {
  return xml
    .match(/<a:t[^>]*>(.*?)<\/a:t>/g)
    ?.map((node) => decodeXml(node.replace(/<[^>]+>/g, "")))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim() || "";
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

export async function deleteStoredDocument(document) {
  await deleteCloudinaryAsset(document.storage);
  await prisma.document.delete({ where: { id: document.id } });
}

async function storageDescriptor({ buffer, name, mime }) {
  if (appConfig.useCloudinary) {
    return uploadBufferToCloudinary({ buffer, fileName: name, mime });
  }
  return { provider: "postgresql", configured: true };
}

function validation(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
