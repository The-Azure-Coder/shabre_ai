import { randomUUID } from "node:crypto";
import { reviewResultSchema } from "./schemas.js";
import { prisma } from "./store.js";
import { createJob } from "./document-service.js";
import { evaluateWithAi } from "./ai-service.js";
import { jobEmitter } from "./realtime-service.js";

const disclaimer = "AI feedback may be incomplete. Review suggestions before submitting academic work.";

export async function createReview({ ownerId, documentId, style, rubric }) {
  const documentRecord = await prisma.document.findFirst({
    where: { id: documentId, ownerId },
  });
  if (!documentRecord) {
    const error = new Error("Document not found");
    error.code = "JOB_NOT_FOUND";
    throw error;
  }

  const reviewId = randomUUID();
  const document = toReviewDocument(documentRecord);
  
  const job = await createJob(ownerId, "review", reviewId, "queued", 10, "Review queued");
  const jobId = job.jobId;

  // Process in background
  (async () => {
    try {
      jobEmitter.emitJobProgress(jobId, 35, "Extracting assignment text");
      
      jobEmitter.emitJobProgress(jobId, 70, "Generating structured feedback with Gemini");
      // Use the AI Service which handles retries and rubric evaluation
      const result = await evaluateWithAi({ 
        text: document.text, 
        rubric, 
        style 
      });
      
      // Ensure the reviewId and documentId are correct in the result
      result.reviewId = reviewId;
      result.documentId = documentId;

      const parsed = reviewResultSchema.safeParse(result);
      if (!parsed.success) {
        console.error("Schema validation failed:", JSON.stringify(parsed.error.format(), null, 2));
        throw new Error("AI response failed schema validation");
      }

      const data = parsed.data;
      const overallScore = data.overallScore || calculateOverallScore(data.scores);

      await prisma.review.create({
        data: {
          id: reviewId,
          ownerId,
          documentId,
          status: data.status,
          summary: data.summary,
          overallScore,
          scores: data.scores,
          recommendations: data.recommendations,
          checklist: data.checklist,
          suggestions: data.suggestions,
          formattingViolations: data.formattingViolations || [],
          disclaimer: data.disclaimer || disclaimer,
          source: "ai-agent",
        },
      });

      // Update job to completed
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "completed", progress: 100, message: "Review ready" }
      });

      jobEmitter.emitJobComplete(jobId, `/api/v1/reviews/${reviewId}`);
    } catch (error) {
      console.error("Background review processing failed:", error.message);
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "error", error: error.message, message: "Review failed" }
      });
      jobEmitter.emitJobError(jobId, error.message);
    }
  })();

  return {
    reviewId,
    jobId: jobId,
    status: "queued",
    pollUrl: `/api/v1/jobs/${jobId}`,
    wsTopic: jobId,
  };
}

function toReviewDocument(document) {
  return {
    documentId: document.id,
    fileName: document.fileName,
    text: document.text,
    structure: document.structure,
  };
}

function calculateOverallScore(scores) {
  if (!Array.isArray(scores) || !scores.length) return 0;
  const ratio = scores.reduce((sum, item) => sum + item.score / Math.max(item.maxScore, 1), 0) / scores.length;
  return Math.round(ratio * 100);
}
