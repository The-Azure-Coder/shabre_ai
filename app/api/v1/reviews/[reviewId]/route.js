import { apiError, json } from "@/lib/api/http";
import { textToStructuredHtml } from "@/lib/api/document-service";
import { requireUser } from "@/lib/api/route-auth";
import { prisma } from "@/lib/api/store";

export async function GET(request, { params }) {
  try {
    const user = await requireUser(request);
    const { reviewId } = await params;
    const review = await prisma.review.findFirst({
      where: { id: reviewId, ownerId: user.id },
      include: { document: true },
    });
    if (!review) {
      return apiError("JOB_NOT_FOUND", "Review not found", 404);
    }
    return json({
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
    return apiError(error.code || "UNAUTHORIZED", error.message, 401);
  }
}
