import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { WebSocket } from "ws";
import { startServer } from "../server-api.js";

const managedPort = Number(process.env.E2E_PORT || 3007);
const baseUrl = process.env.E2E_BASE_URL || `http://127.0.0.1:${managedPort}`;
const email = `e2e-${Date.now()}@example.edu`;
const password = "StrongPassword123!";
let managedServer = null;
let failure = null;

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
      console.log(`Server responded with ${response.status}`);
    } catch (err) {
      console.log(`Connection attempt failed: ${err.message}`);
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for server at ${url}`);
}

async function startManagedServer() {
  if (process.env.E2E_BASE_URL) return null;

  const started = await startServer({
    dev: false,
    hostname: "127.0.0.1",
    port: managedPort,
  });

  await waitForServer(baseUrl);
  return started;
}

try {
  managedServer = await startManagedServer();

  // Skip UI check for standalone API server
  /*
  const pageResponse = await fetch(baseUrl);
  ...
  */

  const signup = await jsonFetch("/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: "Tyrese Morgan" }),
  });
  console.log("Signup status:", signup.response.status);
  assert.equal(signup.response.status, 201);
  assert.ok(signup.body.accessToken);

  const token = signup.body.accessToken;
  const form = new FormData();
  form.append(
    "file",
    new File([
      "Sprint One Essay\n\nThis assignment explains the review pipeline. It needs clear evidence, transitions, and a focused conclusion.",
    ], "sprint-one.txt", { type: "text/plain" }),
  );

  console.log("Uploading document...");
  const uploadResponse = await fetch(`${baseUrl}/api/v1/documents/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const upload = await uploadResponse.json();
  console.log("Upload status:", uploadResponse.status);
  assert.equal(uploadResponse.status, 202);
  
  console.log("Waiting for upload job via WS:", upload.wsTopic);
  const wsUrl = baseUrl.replace(/^http/, "ws") + `/ws/progress?jobId=${upload.wsTopic}&token=${encodeURIComponent(token)}`;
  const wsComplete = await new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out waiting for Upload WebSocket progress"));
    }, 10000);
    socket.on("message", (payload) => {
      const event = JSON.parse(payload.toString());
      console.log("WS Upload Progress:", event);
      if (event.event === "complete" || event.progress === 100) {
        clearTimeout(timer);
        socket.close();
        resolve(event);
      }
    });
    socket.on("error", (err) => {
      console.log("WS Upload Error:", err);
      reject(err);
    });
  });
  assert.equal(wsComplete.event, "complete");

  console.log("Requesting review for document:", upload.documentId);
  const reviewResponse = await fetch(`${baseUrl}/api/v1/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documentId: upload.documentId, style: "APA" }),
  });
  const review = await reviewResponse.json();
  console.log("Review request status:", reviewResponse.status);
  assert.equal(reviewResponse.status, 202);
  assert.ok(review.jobId);

  console.log("Waiting for review job via WS:", review.jobId);
  const wsReviewUrl = baseUrl.replace(/^http/, "ws") + `/ws/progress?jobId=${review.jobId}&token=${encodeURIComponent(token)}`;
  const wsReviewComplete = await new Promise((resolve, reject) => {
    const socket = new WebSocket(wsReviewUrl);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out waiting for Review WebSocket progress"));
    }, 15000);
    socket.on("message", (payload) => {
      const event = JSON.parse(payload.toString());
      console.log("WS Review Progress:", event);
      if (event.event === "complete" || event.progress === 100) {
        clearTimeout(timer);
        socket.close();
        resolve(event);
      }
    });
    socket.on("error", (err) => {
      console.log("WS Review Error:", err);
      reject(err);
    });
  });
  assert.equal(wsReviewComplete.event, "complete");

  const job = await jsonFetch(`/api/v1/jobs/${review.jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(job.response.status, 200);
  assert.equal(job.body.status, "completed");

  const reviewDetail = await jsonFetch(`/api/v1/reviews/${review.reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(reviewDetail.response.status, 200);
  assert.ok(reviewDetail.body.suggestions.length >= 1);

  const summary = await jsonFetch("/api/v1/tools/summarize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: "The draft has a thesis. The supporting evidence needs expansion." }),
  });
  assert.equal(summary.response.status, 200);
  assert.ok(summary.body.summary);

  const paraphrase = await jsonFetch("/api/v1/tools/paraphrase", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: "This argument is really very clear.", tone: "academic", preserveMeaning: true }),
  });
  assert.equal(paraphrase.response.status, 200);
  assert.match(paraphrase.body.paraphrase, /academic/i);

  const formatting = await jsonFetch("/api/v1/tools/formatting", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: "Essay Title\n\nA paragraph without citations.", style: "APA" }),
  });
  assert.equal(formatting.response.status, 200);
  assert.ok(Array.isArray(formatting.body.violations));

  const aiDetect = await jsonFetch("/api/v1/tools/ai-detect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: "It is important to note that this assignment will delve into the topic. Furthermore, the essay uses repeated phrasing." }),
  });
  assert.equal(aiDetect.response.status, 200);
  assert.ok(aiDetect.body.probability >= 0);

  const humanize = await jsonFetch("/api/v1/tools/humanize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: "It is important to note that students utilize evidence.", tone: "natural" }),
  });
  assert.equal(humanize.response.status, 200);
  assert.ok(humanize.body.rewrite);

  const citation = await jsonFetch("/api/v1/tools/citations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sourceType: "website", style: "APA", title: "Learning Strategies", author: "Morgan, Tyrese", year: "2026", publisher: "SmartReview", url: "https://example.com/source" }),
  });
  assert.equal(citation.response.status, 200);
  assert.match(citation.body.citation, /Learning Strategies/);

  const rubric = await jsonFetch("/api/v1/tools/rubric", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: "Essay\n\nThe draft has a claim and evidence.", rubricText: "Argument: 10\nEvidence: 10" }),
  });
  assert.equal(rubric.response.status, 200);
  assert.ok(rubric.body.scores.length >= 1);

  const documents = await jsonFetch("/api/v1/documents", {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(documents.response.status, 200);
  assert.ok(documents.body.documents.some((item) => item.documentId === upload.documentId));

  const reviews = await jsonFetch("/api/v1/reviews", {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(reviews.response.status, 200);
  assert.ok(reviews.body.reviews.some((item) => item.reviewId === review.reviewId));

  const firstPdf = await onePagePdf("First PDF");
  const secondPdf = await onePagePdf("Second PDF");
  const mergeForm = new FormData();
  mergeForm.append("files", new File([firstPdf], "first.pdf", { type: "application/pdf" }));
  mergeForm.append("files", new File([secondPdf], "second.pdf", { type: "application/pdf" }));
  const mergeResponse = await fetch(`${baseUrl}/api/v1/utilities/pdf/merge`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: mergeForm,
  });
  assert.equal(mergeResponse.status, 200);
  assert.equal(mergeResponse.headers.get("content-type"), "application/pdf");
  const mergedPdf = Buffer.from(await mergeResponse.arrayBuffer());
  assert.equal((await PDFDocument.load(mergedPdf)).getPageCount(), 2);

  const splitForm = new FormData();
  splitForm.append("file", new File([mergedPdf], "merged.pdf", { type: "application/pdf" }));
  const splitResponse = await fetch(`${baseUrl}/api/v1/utilities/pdf/split`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: splitForm,
  });
  assert.equal(splitResponse.status, 200);
  assert.equal(splitResponse.headers.get("content-type"), "application/zip");
  const splitZip = await JSZip.loadAsync(Buffer.from(await splitResponse.arrayBuffer()));
  assert.equal(Object.keys(splitZip.files).filter((name) => name.endsWith(".pdf")).length, 2);

  const docxForm = new FormData();
  docxForm.append("file", new File([await minimalDocx()], "convert.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
  const convertResponse = await fetch(`${baseUrl}/api/v1/utilities/docx-to-pdf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: docxForm,
  });
  if (convertResponse.status === 503) {
    const body = await convertResponse.json();
    assert.match(body.error.message, /LibreOffice/);
  } else {
    assert.equal(convertResponse.status, 200);
    assert.equal(convertResponse.headers.get("content-type"), "application/pdf");
    const convertedPdf = Buffer.from(await convertResponse.arrayBuffer());
    assert.ok((await PDFDocument.load(convertedPdf)).getPageCount() >= 1);
  }

  console.log("E2E smoke passed:", baseUrl);
} catch (error) {
  failure = error;
} finally {
  if (managedServer) {
    await managedServer.close();
  }
}

if (failure) {
  throw failure;
}

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
