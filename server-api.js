import express from 'express';
import cors from 'cors';
import http from 'node:http';
import multer from 'multer';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyToken } from './lib/api/auth-service.js';
import { prisma } from './lib/api/store.js';
import { loginUser, signupUser } from './lib/api/auth-service.js';
import { 
  loginSchema, 
  signupSchema, 
  reviewSchema, 
  summarizeSchema,
  paraphraseSchema,
  formattingSchema,
  aiDetectionSchema,
  humanizeSchema,
  citationSchema,
  rubricEvaluationSchema
} from './lib/api/schemas.js';
import { createReview } from './lib/api/review-service.js';
import { 
  acceptUpload, 
  deleteStoredDocument, 
  prepareEditorDocumentContent, 
  textToStructuredHtml 
} from './lib/api/document-service.js';
import {
  summarizeText,
  paraphraseText,
  checkFormatting,
  detectAiText,
  humanizeText,
  generateCitation,
  evaluateRubric
} from './lib/api/tools-service.js';
import {
  convertDocxToPdf,
  mergePdfFiles,
  splitPdfFile
} from './lib/api/file-utilities-service.js';
import { jobEmitter } from './lib/api/realtime-service.js';
import path from 'node:path';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Auth Middleware
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }
  const token = authHeader.split(' ')[1];
  try {
    const tokenUser = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: tokenUser.id } });
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}

function scorePercent(scores) {
  if (!Array.isArray(scores) || !scores.length) return 0;
  const ratio = scores.reduce((sum, score) => sum + score.score / Math.max(score.maxScore, 1), 0) / scores.length;
  return Math.round(ratio * 100);
}

// Auth Routes
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const input = signupSchema.parse(req.body);
    const result = await signupUser(input);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

// Dashboard
app.get('/api/v1/dashboard', authenticate, async (req, res) => {
  try {
    const [documents, reviews] = await Promise.all([
      prisma.document.findMany({
        where: { ownerId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.review.findMany({
        where: { ownerId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { document: { select: { fileName: true, mime: true, size: true } } },
      }),
    ]);

    const scores = reviews.flatMap((review) => Array.isArray(review.scores) ? review.scores : []);
    const averageScore = scores.length
      ? scores.reduce((sum, item) => sum + item.score / Math.max(item.maxScore, 1), 0) / scores.length
      : 0;

    res.json({
      user: { id: req.user.id, email: req.user.email, name: req.user.name },
      stats: {
        documentsReviewed: documents.length,
        reviewsCompleted: reviews.length,
        averageScore: averageScore ? Number((averageScore * 5).toFixed(1)) : 0,
        aiCreditsLeft: 8450,
        aiCreditsTotal: 10000,
      },
      recentReviews: reviews.map((review) => ({
        reviewId: review.id,
        documentId: review.documentId,
        fileName: review.document.fileName,
        mime: review.document.mime,
        size: review.document.size,
        createdAt: review.createdAt.toISOString(),
        status: review.status,
        score: scorePercent(review.scores),
      })),
      activity: reviews.map((review) => ({
        id: review.id,
        title: `Review completed: ${review.document.fileName}`,
        createdAt: review.createdAt.toISOString(),
        type: "review",
      })),
      deadlines: [],
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Reviews
app.get('/api/v1/reviews', authenticate, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { document: { select: { fileName: true, mime: true, size: true } } },
    });

    res.json({
      reviews: reviews.map((review) => ({
        reviewId: review.id,
        documentId: review.documentId,
        fileName: review.document.fileName,
        mime: review.document.mime,
        size: review.document.size,
        status: review.status,
        summary: review.summary,
        overallScore: review.overallScore,
        scores: review.scores,
        recommendations: review.recommendations,
        checklist: review.checklist,
        suggestions: review.suggestions,
        formattingViolations: review.formattingViolations,
        disclaimer: review.disclaimer,
        createdAt: review.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

app.get('/api/v1/reviews/:id', authenticate, async (req, res) => {
  try {
    const review = await prisma.review.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: { document: true },
    });
    if (!review) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review not found' } });
    }
    res.json({
      reviewId: review.id,
      documentId: review.documentId,
      status: review.status,
      summary: review.summary,
      overallScore: review.overallScore,
      scores: review.scores,
      recommendations: review.recommendations,
      checklist: review.checklist,
      suggestions: review.suggestions,
      formattingViolations: review.formattingViolations,
      disclaimer: review.disclaimer,
      document: {
        fileName: review.document.fileName,
        text: review.document.text,
        textPreview: review.document.text.slice(0, 4000),
        contentHtml: review.document.storage?.contentHtml || textToStructuredHtml(review.document.text),
        structure: review.document.structure,
      },
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

app.post('/api/v1/reviews', authenticate, async (req, res) => {
  try {
    const input = reviewSchema.parse(req.body);
    const result = await createReview({ ownerId: req.user.id, ...input });
    res.status(202).json(result);
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

// Documents
app.get('/api/v1/documents', authenticate, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ 
      documents: documents.map(d => ({
        documentId: d.id,
        fileName: d.fileName,
        mime: d.mime,
        size: d.size,
        createdAt: d.createdAt.toISOString(),
        structure: d.structure
      }))
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

app.post('/api/v1/documents/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded");
    // Convert multer file to the format acceptUpload expects
    const file = {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      arrayBuffer: () => Promise.resolve(req.file.buffer),
    };
    const result = await acceptUpload({ file, ownerId: req.user.id });
    res.status(202).json(result);
  } catch (error) {
    res.status(400).json({ error: { code: error.code || 'VALIDATION_ERROR', message: error.message } });
  }
});

app.get('/api/v1/documents/:id', authenticate, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
    });
    if (!document) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }
    res.json({
      documentId: document.id,
      fileName: document.fileName,
      mime: document.mime,
      size: document.size,
      createdAt: document.createdAt.toISOString(),
      storage: document.storage,
      secureUrl: document.storage?.secureUrl || null,
      contentHtml: document.storage?.contentHtml || textToStructuredHtml(document.text),
      structure: document.structure,
      text: document.text,
      textPreview: document.text.slice(0, 4000),
    });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

app.patch('/api/v1/documents/:id', authenticate, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!document) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });

    const { html, text } = req.body;
    const content = prepareEditorDocumentContent({ html: String(html || "").trim(), text: String(text || "").trim() });
    const storage = { ...(document.storage || {}), contentHtml: content.contentHtml, edited: true };

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: { text: content.text, structure: content.structure, storage },
    });

    res.json({
      documentId: updated.id,
      fileName: updated.fileName,
      mime: updated.mime,
      size: updated.size,
      createdAt: updated.createdAt.toISOString(),
      storage: updated.storage,
      secureUrl: updated.storage?.secureUrl || null,
      contentHtml: updated.storage?.contentHtml || textToStructuredHtml(updated.text),
      structure: updated.structure,
      text: updated.text,
      textPreview: updated.text.slice(0, 4000),
    });
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.delete('/api/v1/documents/:id', authenticate, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!document) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
    await deleteStoredDocument(document);
    res.json({ deleted: true, documentId: req.params.id });
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

// Jobs
app.get('/api/v1/jobs/:id', authenticate, async (req, res) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
    });
    if (!job) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// Tools
app.post('/api/v1/tools/summarize', authenticate, async (req, res) => {
  try {
    const input = summarizeSchema.parse(req.body);
    res.json(await summarizeText(input));
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tools/paraphrase', authenticate, async (req, res) => {
  try {
    const input = paraphraseSchema.parse(req.body);
    res.json(await paraphraseText(input));
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tools/formatting', authenticate, async (req, res) => {
  try {
    const input = formattingSchema.parse(req.body);
    res.json(await checkFormatting(input));
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tools/ai-detect', authenticate, async (req, res) => {
  try {
    const input = aiDetectionSchema.parse(req.body);
    res.json(await detectAiText(input));
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tools/humanize', authenticate, async (req, res) => {
  try {
    const input = humanizeSchema.parse(req.body);
    res.json(await humanizeText(input));
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tools/citations', authenticate, async (req, res) => {
  try {
    const input = citationSchema.parse(req.body);
    res.json(await generateCitation(input));
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/tools/rubric', authenticate, async (req, res) => {
  try {
    const input = rubricEvaluationSchema.parse(req.body);
    res.json(await evaluateRubric(input));
  } catch (error) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

// Utilities
app.post('/api/v1/utilities/docx-to-pdf', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded");
    const result = await convertDocxToPdf({
      file: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        arrayBuffer: () => Promise.resolve(req.file.buffer),
      }
    });
    res.setHeader('Content-Type', result.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.buffer);
  } catch (error) {
    res.status(400).json({ error: { code: error.code || 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/utilities/pdf/merge', authenticate, upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) throw new Error("At least two files are required");
    const files = req.files.map(f => ({
      name: f.originalname,
      type: f.mimetype,
      size: f.size,
      arrayBuffer: () => Promise.resolve(f.buffer),
    }));
    const result = await mergePdfFiles({ files });
    res.setHeader('Content-Type', result.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.buffer);
  } catch (error) {
    res.status(400).json({ error: { code: error.code || 'VALIDATION_ERROR', message: error.message } });
  }
});

app.post('/api/v1/utilities/pdf/split', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded");
    const result = await splitPdfFile({
      file: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        arrayBuffer: () => Promise.resolve(req.file.buffer),
      }
    });
    res.setHeader('Content-Type', result.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.buffer);
  } catch (error) {
    res.status(400).json({ error: { code: error.code || 'VALIDATION_ERROR', message: error.message } });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// WebSocket implementation
server.on("upgrade", (req, socket, head) => {
  const pathname = new URL(req.url || "", `http://${req.headers.host}`).pathname;
  if (pathname === "/ws/progress") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", async (socket, request) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const jobId = url.searchParams.get("jobId");
  const token = url.searchParams.get("token");

  try {
    await verifyToken(token || "");
  } catch {
    socket.close(1008, "Unauthorized");
    return;
  }

  if (!jobId) {
    socket.close(1003, "Job ID Required");
    return;
  }

  const handler = (data) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      if (data.event === 'complete' || data.event === 'error') {
        socket.close();
      }
    }
  };

  jobEmitter.on(`job:${jobId}`, handler);

  socket.on("close", () => {
    jobEmitter.off(`job:${jobId}`, handler);
  });
});

const PORT = 3001;

export function startServer({ port = PORT, hostname = '127.0.0.1' } = {}) {
  return new Promise((resolve) => {
    const srv = server.listen(port, hostname, () => {
      console.log(`API and WebSocket server running on http://${hostname}:${port}`);
      resolve({
        server: srv,
        port,
        hostname,
        async close() {
          await new Promise((resolve) => srv.close(resolve));
          wss.close();
        }
      });
    });
  });
}

import { fileURLToPath } from 'node:url';

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === (process.argv[1].includes(':') ? process.argv[1] : path.resolve(process.argv[1]));

if (isDirectRun) {
  startServer();
}
