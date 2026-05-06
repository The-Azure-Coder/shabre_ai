import { acceptUpload } from "@/lib/api/document-service";
import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const form = await request.formData();
    const file = form.get("file");
    return json(await acceptUpload({ file, ownerId: user.id }), 202);
  } catch (error) {
    const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FILE_TOO_LARGE" ? 413 : 400;
    return apiError(error.code || "VALIDATION_ERROR", error.message, status);
  }
}
