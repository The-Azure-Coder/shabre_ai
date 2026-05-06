import { apiError, json } from "@/lib/api/http";
import { textToStructuredHtml } from "@/lib/api/document-service";
import { requireUser } from "@/lib/api/route-auth";
import { prisma } from "@/lib/api/store";

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const documents = await prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { reviews: { select: { id: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    });

    return json({
      documents: documents.map((document) => ({
        documentId: document.id,
        fileName: document.fileName,
        mime: document.mime,
        size: document.size,
        storage: document.storage,
        secureUrl: document.storage?.secureUrl || null,
        contentHtml: document.storage?.contentHtml || textToStructuredHtml(document.text),
        structure: document.structure,
        textPreview: document.text.slice(0, 280),
        createdAt: document.createdAt.toISOString(),
        latestReview: document.reviews[0]
          ? {
              reviewId: document.reviews[0].id,
              status: document.reviews[0].status,
              createdAt: document.reviews[0].createdAt.toISOString(),
            }
          : null,
      })),
    });
  } catch (error) {
    return apiError(error.code || "UNAUTHORIZED", error.message, 401);
  }
}
