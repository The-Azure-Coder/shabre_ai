import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { appConfig } from "./config.js";
import { safeFilename } from "./security.js";

const execFileAsync = promisify(execFile);
const pdfMime = "application/pdf";
const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function convertDocxToPdf({ file }) {
  validateFile(file, {
    requiredMime: docxMime,
    extensions: [".docx"],
    label: "DOCX",
  });

  const libreOffice = await resolveLibreOffice();
  const workDir = join(tmpdir(), `smartreview-convert-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const inputName = safeFilename(file.name);
    const inputPath = join(workDir, inputName);
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    await execFileAsync(libreOffice, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      workDir,
      inputPath,
    ], { windowsHide: true, timeout: 60_000 });

    const outputPath = join(workDir, `${basename(inputName, ".docx")}.pdf`);
    const pdf = await readFile(outputPath);
    await assertValidPdf(pdf, "Converted PDF");

    return {
      fileName: `${basename(inputName, ".docx")}.pdf`,
      mime: pdfMime,
      buffer: pdf,
    };
  } catch (error) {
    if (!error.code) error.code = "CONVERSION_FAILED";
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export async function mergePdfFiles({ files }) {
  if (!Array.isArray(files) || files.length < 2) {
    validation("VALIDATION_ERROR", "At least two PDF files are required");
  }

  const merged = await PDFDocument.create();
  for (const file of files) {
    validateFile(file, { requiredMime: pdfMime, extensions: [".pdf"], label: "PDF" });
    const source = await PDFDocument.load(Buffer.from(await file.arrayBuffer()));
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  const output = Buffer.from(await merged.save());
  await assertValidPdf(output, "Merged PDF");
  return {
    fileName: "merged.pdf",
    mime: pdfMime,
    buffer: output,
  };
}

export async function splitPdfFile({ file }) {
  validateFile(file, { requiredMime: pdfMime, extensions: [".pdf"], label: "PDF" });
  const source = await PDFDocument.load(Buffer.from(await file.arrayBuffer()));
  const zip = new JSZip();
  const baseName = basename(safeFilename(file.name), ".pdf") || "document";

  for (const pageIndex of source.getPageIndices()) {
    const output = await PDFDocument.create();
    const [page] = await output.copyPages(source, [pageIndex]);
    output.addPage(page);
    const pdf = Buffer.from(await output.save());
    await assertValidPdf(pdf, `Split page ${pageIndex + 1}`);
    zip.file(`${baseName}-page-${pageIndex + 1}.pdf`, pdf);
  }

  return {
    fileName: `${baseName}-pages.zip`,
    mime: "application/zip",
    buffer: Buffer.from(await zip.generateAsync({ type: "uint8array" })),
    pageCount: source.getPageCount(),
  };
}

export async function assertValidPdf(buffer, label = "PDF") {
  try {
    const pdf = await PDFDocument.load(buffer);
    if (pdf.getPageCount() < 1) {
      validation("INVALID_PDF", `${label} has no pages`);
    }
    return { pageCount: pdf.getPageCount() };
  } catch (error) {
    if (error.code) throw error;
    validation("INVALID_PDF", `${label} is not a valid PDF`);
  }
}

export async function resolveLibreOffice() {
  const configured = appConfig.libreOfficePath;
  if (configured) {
    if (existsSync(configured)) return configured;
    validation("CONVERTER_NOT_AVAILABLE", "Configured LibreOffice path does not exist");
  }

  const candidates = [
    "soffice",
    "libreoffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ];

  for (const candidate of candidates) {
    if (candidate.includes("\\")) {
      if (existsSync(candidate)) return candidate;
      continue;
    }
    try {
      await execFileAsync(candidate, ["--version"], { windowsHide: true, timeout: 10_000 });
      return candidate;
    } catch {}
  }

  validation("CONVERTER_NOT_AVAILABLE", "LibreOffice headless is required for DOCX to PDF conversion");
}

function validateFile(file, { requiredMime, extensions, label }) {
  if (!file || !file.name) {
    validation("VALIDATION_ERROR", `${label} file is required`);
  }
  const name = safeFilename(file.name).toLowerCase();
  const hasExtension = extensions.some((extension) => name.endsWith(extension));
  if (!hasExtension || file.type !== requiredMime) {
    validation("UNSUPPORTED_FILE_TYPE", `Only ${label} files are supported`);
  }
  if (file.size <= 0) {
    validation("VALIDATION_ERROR", `${label} file cannot be empty`);
  }
  if (file.size > appConfig.uploadMaxBytes) {
    validation("FILE_TOO_LARGE", `${label} file exceeds the configured upload limit`);
  }
}

function validation(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
