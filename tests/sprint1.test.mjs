import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import JSZip from "jszip";
import { signupUser, loginUser, verifyToken } from "../lib/api/auth-service.js";
import { acceptUpload, prepareEditorDocumentContent } from "../lib/api/document-service.js";
import { createReview } from "../lib/api/review-service.js";
import { reviewResultSchema } from "../lib/api/schemas.js";
import { summarizeText, paraphraseText, checkFormatting, detectAiText, humanizeText, generateCitation, evaluateRubric } from "../lib/api/tools-service.js";
import { mergePdfFiles, splitPdfFile, assertValidPdf, resolveLibreOffice, convertDocxToPdf } from "../lib/api/file-utilities-service.js";
import { assertRateLimit, resetRateLimitsForTests } from "../lib/api/security.js";
import { requireUser } from "../lib/api/route-auth.js";
import { prisma, resetStoreForTests } from "../lib/api/store.js";
import { PDFDocument } from "pdf-lib";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-with-enough-length";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test/test";
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "test-cloud";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "test-key";
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "test-secret";
process.env.USE_CLOUDINARY = "false";

test.beforeEach(async () => {
  await resetStoreForTests();
  resetRateLimitsForTests();
});

test("auth signup/login returns safe user payloads and valid JWTs", async () => {
  const signup = await signupUser({
    email: "Student@Example.edu",
    password: "StrongPassword123!",
    name: "Tyrese Morgan",
  });

  assert.equal(signup.user.email, "student@example.edu");
  assert.equal(signup.user.name, "Tyrese Morgan");
  assert.ok(signup.accessToken);
  assert.equal(signup.user.passwordHash, undefined);
  const storedUser = await prisma.user.findUnique({ where: { email: "student@example.edu" } });
  assert.notEqual(storedUser.passwordHash, "StrongPassword123!");

  const verified = await verifyToken(signup.accessToken);
  assert.equal(verified.email, "student@example.edu");

  const login = await loginUser({ email: "student@example.edu", password: "StrongPassword123!" });
  assert.equal(login.user.id, signup.user.id);
});

test("protected auth rejects invalid JWT and rate limits repeated attempts", async () => {
  await assert.rejects(() => verifyToken("invalid-token"), /Invalid Compact JWS/);

  for (let index = 0; index < 3; index += 1) {
    assert.doesNotThrow(() => assertRateLimit("auth-test", 3, 10_000));
  }
  assert.throws(() => assertRateLimit("auth-test", 3, 10_000), /Too many requests/);
});

test("requireUser rejects tokens for deleted users before document creation", async () => {
  const signup = await signupUser({
    email: "stale@example.edu",
    password: "StrongPassword123!",
    name: "Tyrese Morgan",
  });

  await prisma.user.delete({ where: { id: signup.user.id } });

  const request = new Request("http://localhost/api/v1/documents/upload", {
    headers: {
      Authorization: `Bearer ${signup.accessToken}`,
    },
  });

  await assert.rejects(() => requireUser(request), (error) => error.code === "UNAUTHORIZED");
});

test("upload parses txt files, rejects unsupported files, and creates polling job", async () => {
  const { user } = await signupUser({
    email: "student@example.edu",
    password: "StrongPassword123!",
    name: "Tyrese Morgan",
  });

  const validFile = new File([
    "Climate Change Research\n\nThis paper argues that climate policy needs evidence. The draft needs clearer transitions.",
  ], "essay.txt", { type: "text/plain" });

  const upload = await acceptUpload({ file: validFile, ownerId: user.id });
  assert.equal(upload.status, "queued");
  assert.equal(upload.structure.title, "Climate Change Research");
  assert.ok(upload.structure.wordCount > 10);
  assert.ok(await prisma.job.findUnique({ where: { id: upload.wsTopic } }));

  const invalidFile = new File(["bad"], "malware.exe", { type: "application/octet-stream" });
  await assert.rejects(() => acceptUpload({ file: invalidFile, ownerId: user.id }), /File type is not supported/);
});

test("upload extracts previews from pdf, docx, and pptx files", async () => {
  const { user } = await signupUser({
    email: "student@example.edu",
    password: "StrongPassword123!",
    name: "Tyrese Morgan",
  });

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 74 >>
stream
BT /F1 24 Tf 72 720 Td (PDF extracted text works.) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000365 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
435
%%EOF`;
  const pdfUpload = await acceptUpload({ file: new File([pdf], "paper.pdf", { type: "application/pdf" }), ownerId: user.id });
  assert.match(pdfUpload.textPreview, /PDF extracted text works/);

  const docxZip = new JSZip();
  docxZip.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  docxZip.file("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  docxZip.file("word/document.xml", '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>extracted</w:t></w:r><w:r><w:t> text works.</w:t></w:r></w:p></w:body></w:document>');
  const docxBuffer = await docxZip.generateAsync({ type: "uint8array" });
  const docxUpload = await acceptUpload({
    file: new File([docxBuffer], "paper.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    ownerId: user.id,
  });
  assert.match(docxUpload.textPreview, /DOCX extracted text works/);
  assert.match(docxUpload.contentHtml, /<strong>extracted<\/strong>/);

  const pptxZip = new JSZip();
  pptxZip.file("ppt/slides/slide1.xml", '<p:sld xmlns:p="p" xmlns:a="a"><a:t>PPTX extracted text works.</a:t></p:sld>');
  const pptxBuffer = await pptxZip.generateAsync({ type: "uint8array" });
  const pptxUpload = await acceptUpload({
    file: new File([pptxBuffer], "slides.pptx", { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }),
    ownerId: user.id,
  });
  assert.match(pptxUpload.textPreview, /PPTX extracted text works/);
});

test("editor content preparation preserves html and normalized text", () => {
  const content = prepareEditorDocumentContent({
    html: "<p><strong>Hello</strong> world</p>",
    text: "Hello world",
  });

  assert.equal(content.text, "Hello world");
  assert.equal(content.structure.wordCount, 2);
  assert.equal(content.contentHtml, "<p><strong>Hello</strong> world</p>");

  const fallback = prepareEditorDocumentContent({
    html: "",
    text: "First line\n\nSecond line",
  });
  assert.match(fallback.contentHtml, /<h2>First line<\/h2>|<p>First line<\/p>/);
});

test("review pipeline returns schema-valid structured grounded output", async () => {
  const { user } = await signupUser({
    email: "student@example.edu",
    password: "StrongPassword123!",
    name: "Tyrese Morgan",
  });
  const file = new File([
    "Assignment Title\n\nThe essay makes a claim. It really needs more evidence and a stronger closing paragraph.",
  ], "assignment.txt", { type: "text/plain" });
  const upload = await acceptUpload({ file, ownerId: user.id });

  const review = await createReview({
    ownerId: user.id,
    documentId: upload.documentId,
    style: "APA",
    rubric: { criteria: [{ name: "Argument", maxScore: 10, description: "Logical support" }] },
  });

  assert.equal(review.status, "queued");
  assert.equal(review.result.status, "completed");
  assert.ok(review.result.formattingViolations.every((item) => item.style === "APA"));
  assert.equal(reviewResultSchema.safeParse(review.result).success, true);
  assert.ok(review.result.suggestions.length > 0);
  assert.ok(review.result.suggestions.some((item) => item.type === "clarity"));
});

test("writing utilities return structured deterministic outputs", () => {
  const summary = summarizeText({
    text: "The research question is clear. The evidence is uneven. The conclusion needs stronger synthesis.",
  });
  assert.ok(summary.summary.includes("research question"));
  assert.ok(Array.isArray(summary.bullets));

  const paraphrase = paraphraseText({ text: "This claim is really very important.", tone: "academic" });
  assert.ok(paraphrase.paraphrase.startsWith("In academic terms"));
  assert.ok(paraphrase.notes.includes("Tone adjusted to academic"));
});

test("expanded tools return structured deterministic outputs", () => {
  const formatting = checkFormatting({
    text: "Draft Title\n\nThis paragraph cites no outside source.",
    style: "APA",
  });
  assert.equal(formatting.style, "APA");
  assert.ok(formatting.violations.some((item) => item.location === "References"));

  const detection = detectAiText({
    text: "It is important to note that this essay will delve into the realm of learning. Furthermore, it is important to note that the topic is meaningful.",
  });
  assert.ok(detection.probability >= 0 && detection.probability <= 100);
  assert.ok(detection.disclaimer);

  const humanized = humanizeText({ text: "It is important to note that students utilize evidence.", tone: "natural" });
  assert.ok(humanized.rewrite.includes("use"));
  assert.ok(humanized.sideBySide.original);

  const citation = generateCitation({
    sourceType: "website",
    style: "MLA",
    title: "Learning Strategies",
    author: "Morgan, Tyrese",
    year: "2026",
    publisher: "SmartReview",
    url: "https://example.com/source",
  });
  assert.match(citation.citation, /Learning Strategies/);

  const rubric = evaluateRubric({
    text: "Research Essay\n\nThe argument has a claim and evidence.\n\nThe conclusion connects the ideas.",
    rubricText: "Argument: 10\nEvidence: 10",
  });
  assert.equal(rubric.scores.length, 2);
  assert.ok(rubric.total <= rubric.maxTotal);
});

test("PDF utilities merge and split valid non-corrupt PDFs", async () => {
  const first = await onePagePdf("First PDF");
  const second = await onePagePdf("Second PDF");

  const merged = await mergePdfFiles({
    files: [
      new File([first], "first.pdf", { type: "application/pdf" }),
      new File([second], "second.pdf", { type: "application/pdf" }),
    ],
  });
  const mergedValidation = await assertValidPdf(merged.buffer, "Merged PDF");
  assert.equal(merged.mime, "application/pdf");
  assert.equal(mergedValidation.pageCount, 2);

  const split = await splitPdfFile({
    file: new File([merged.buffer], "merged.pdf", { type: "application/pdf" }),
  });
  assert.equal(split.mime, "application/zip");
  assert.equal(split.pageCount, 2);
  assert.ok(split.buffer.length > 0);
});

test("DOCX conversion returns a valid PDF when LibreOffice is available", async () => {
  try {
    await resolveLibreOffice();
  } catch (error) {
    assert.equal(error.code, "CONVERTER_NOT_AVAILABLE");
    return;
  }

  const converted = await convertDocxToPdf({
    file: new File([await minimalDocx()], "convert.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
  });
  const validation = await assertValidPdf(converted.buffer, "Converted PDF");
  assert.equal(converted.mime, "application/pdf");
  assert.equal(converted.fileName, "convert.pdf");
  assert.ok(validation.pageCount >= 1);
});

test("dashboard implementation includes required design structure and theme states", async () => {
  const page = await readFile(new URL("../components/dashboard/dashboard-shell.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const data = await readFile(new URL("../lib/demo-data.js", import.meta.url), "utf8");

  assert.match(page, /Welcome back,/);
  assert.match(data, /Tyrese Morgan/);
  assert.match(page, /ToolsGrid/);
  assert.match(page, /StatsCards/);
  assert.match(page, /RecentReviews/);
  assert.match(page, /ActivityPanel/);
  assert.match(page, /DeadlinesPanel/);
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\.app-shell[\s\S]*grid-template-columns:/);
  assert.match(css, /\.dashboard[\s\S]*grid-template-columns:/);
});

async function onePagePdf(label) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([300, 200]);
  page.drawText(label, { x: 40, y: 120 });
  return Buffer.from(await pdf.save());
}

async function minimalDocx() {
  const docx = new JSZip();
  docx.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  docx.file("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  docx.file("word/document.xml", '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX conversion test document.</w:t></w:r></w:p></w:body></w:document>');
  return Buffer.from(await docx.generateAsync({ type: "uint8array" }));
}

test("navigation, auth pages, and utility pages are backed by real routes", async () => {
  const sidebar = await readFile(new URL("../components/layout/sidebar.js", import.meta.url), "utf8");
  const uploadCard = await readFile(new URL("../components/dashboard/upload-card.js", import.meta.url), "utf8");
  const authForm = await readFile(new URL("../components/auth/auth-form.js", import.meta.url), "utf8");
  const toolPage = await readFile(new URL("../components/tools/text-tool-page.js", import.meta.url), "utf8");
  const specializedTools = await readFile(new URL("../components/tools/specialized-tool-pages.js", import.meta.url), "utf8");
  const summarizerPage = await readFile(new URL("../app/summarizer/page.js", import.meta.url), "utf8");
  const writingToolsPage = await readFile(new URL("../app/writing-tools/page.js", import.meta.url), "utf8");
  const data = await readFile(new URL("../lib/demo-data.js", import.meta.url), "utf8");

  for (const route of ["/dashboard", "/documents", "/reviews", "/rubrics", "/formatting", "/writing-tools", "/ai-detector", "/humanizer", "/utilities", "/summarizer", "/citations", "/profile", "/settings", "/help"]) {
    assert.match(data, new RegExp(`"${route}"`));
  }
  assert.match(sidebar, /<Link/);
  assert.doesNotMatch(sidebar, /href="#"/);
  assert.match(uploadCard, /validateUploadFile/);
  assert.match(uploadCard, /Extracted Text Preview/);
  assert.match(authForm, /\/api\/v1\/auth\//);
  assert.match(toolPage, /fetch\(endpoint/);
  assert.match(specializedTools, /\/api\/v1\/tools\/formatting/);
  assert.match(specializedTools, /\/api\/v1\/tools\/ai-detect/);
  assert.match(specializedTools, /\/api\/v1\/tools\/humanize/);
  assert.match(specializedTools, /\/api\/v1\/tools\/citations/);
  assert.match(specializedTools, /\/api\/v1\/tools\/rubric/);
  assert.match(summarizerPage, /\/api\/v1\/tools\/summarize/);
  assert.match(writingToolsPage, /\/api\/v1\/tools\/paraphrase/);
});
