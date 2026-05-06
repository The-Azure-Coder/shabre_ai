import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";
import { humanizeSchema } from "@/lib/api/schemas";
import { humanizeText } from "@/lib/api/tools-service";

export async function POST(request) {
  try {
    await requireUser(request);
    const input = humanizeSchema.parse(await request.json());
    return json(humanizeText(input));
  } catch (error) {
    return apiError(error.code || "VALIDATION_ERROR", error.message, error.code === "UNAUTHORIZED" ? 401 : 400);
  }
}
