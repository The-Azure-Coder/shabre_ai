import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";
import { prisma } from "@/lib/api/store";

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const [documents, reviews] = await Promise.all([
      prisma.document.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.review.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { document: { select: { fileName: true, mime: true, size: true } } },
      }),
    ]);

    const scores = reviews.flatMap((review) => Array.isArray(review.scores) ? review.scores : []);
    const averageScore = scores.length
      ? scores.reduce((sum, item) => sum + item.score / Math.max(item.maxScore, 1), 0) / scores.length
      : 0;

    return json({
      user: { id: user.id, email: user.email, name: user.name },
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
    return apiError(error.code || "UNAUTHORIZED", error.message, 401);
  }
}

function scorePercent(scores) {
  if (!Array.isArray(scores) || !scores.length) return 0;
  const ratio = scores.reduce((sum, score) => sum + score.score / Math.max(score.maxScore, 1), 0) / scores.length;
  return Math.round(ratio * 100);
}
