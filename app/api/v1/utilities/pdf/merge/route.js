import { mergePdfFiles } from "@/lib/api/file-utilities-service";
import { apiError } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";

export async function POST(request) {
  try {
    await requireUser(request);
    const form = await request.formData();
    const result = await mergePdfFiles({ files: form.getAll("files") });
    return fileResponse(result);
  } catch (error) {
    return apiError(error.code || "PDF_MERGE_FAILED", error.message, statusFor(error));
  }
}

function fileResponse({ buffer, mime, fileName }) {
  return new Response(buffer, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(buffer.length),
    },
  });
}

function statusFor(error) {
  if (error.code === "UNAUTHORIZED") return 401;
  if (error.code === "FILE_TOO_LARGE") return 413;
  return 400;
}
