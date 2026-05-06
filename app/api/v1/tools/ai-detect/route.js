import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";
import { aiDetectionSchema } from "@/lib/api/schemas";
import { detectAiText } from "@/lib/api/tools-service";

export async function POST(request) {
  try {
    await requireUser(request);
    const input = aiDetectionSchema.parse(await request.json());
    return json(detectAiText(input));
  } catch (error) {
    return apiError(error.code || "VALIDATION_ERROR", error.message, error.code === "UNAUTHORIZED" ? 401 : 400);
  }
}
