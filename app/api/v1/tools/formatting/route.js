import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";
import { formattingSchema } from "@/lib/api/schemas";
import { checkFormatting } from "@/lib/api/tools-service";

export async function POST(request) {
  try {
    await requireUser(request);
    const input = formattingSchema.parse(await request.json());
    return json(checkFormatting(input));
  } catch (error) {
    return apiError(error.code || "VALIDATION_ERROR", error.message, error.code === "UNAUTHORIZED" ? 401 : 400);
  }
}
