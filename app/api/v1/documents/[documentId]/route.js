import { apiError, json } from "@/lib/api/http";
import { deleteStoredDocument, prepareEditorDocumentContent, textToStructuredHtml } from "@/lib/api/document-service";
import { requireUser } from "@/lib/api/route-auth";
import { prisma } from "@/lib/api/store";

export async function GET(request, { params }) {
  try {
    const user = await requireUser(request);
    const { documentId } = await params;
    const document = await prisma.document.findFirst({ where: { id: documentId, ownerId: user.id } });

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found", 404);
    }

    return json({
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
    return apiError(error.code || "VALIDATION_ERROR", error.message, error.code === "UNAUTHORIZED" ? 401 : 400);
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireUser(request);
    const { documentId } = await params;
    const document = await prisma.document.findFirst({ where: { id: documentId, ownerId: user.id } });

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found", 404);
    }

    const payload = await request.json();
    const html = String(payload.html || "").trim();
    const text = String(payload.text || "").trim();
    if (!text) {
      return apiError("VALIDATION_ERROR", "Document text cannot be empty", 400);
    }

    const content = prepareEditorDocumentContent({ html, text });
    const storage = {
      ...(document.storage || {}),
      contentHtml: content.contentHtml,
      edited: true,
    };

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        text: content.text,
        structure: content.structure,
        storage,
      },
    });

    return json({
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
    return apiError(error.code || "VALIDATION_ERROR", error.message, error.code === "UNAUTHORIZED" ? 401 : 400);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser(request);
    const { documentId } = await params;
    const document = await prisma.document.findFirst({ where: { id: documentId, ownerId: user.id } });

    if (!document) {
      return apiError("DOCUMENT_NOT_FOUND", "Document not found", 404);
    }

    await deleteStoredDocument(document);
    return json({ deleted: true, documentId });
  } catch (error) {
    return apiError(error.code || "VALIDATION_ERROR", error.message, error.code === "UNAUTHORIZED" ? 401 : 400);
  }
}
