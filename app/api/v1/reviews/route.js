import { createReview } from "@/lib/api/review-service";
import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";
import { reviewSchema } from "@/lib/api/schemas";
import { prisma } from "@/lib/api/store";

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const reviews = await prisma.review.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { document: { select: { fileName: true, mime: true, size: true } } },
    });

    return json({
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
    return apiError(error.code || "UNAUTHORIZED", error.message, 401);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const input = reviewSchema.parse(await request.json());
    return json(await createReview({ ownerId: user.id, ...input }), 202);
  } catch (error) {
    const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "JOB_NOT_FOUND" ? 404 : 400;
    return apiError(error.code || "VALIDATION_ERROR", error.message, status);
  }
}
