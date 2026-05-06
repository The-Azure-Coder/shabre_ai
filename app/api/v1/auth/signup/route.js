import { apiError, json } from "@/lib/api/http";
import { assertRateLimit } from "@/lib/api/security";
import { signupSchema } from "@/lib/api/schemas";
import { signupUser } from "@/lib/api/auth-service";

export async function POST(request) {
  try {
    assertRateLimit(`signup:${request.headers.get("x-forwarded-for") || "local"}`, 8);
    const input = signupSchema.parse(await request.json());
    return json(await signupUser(input), 201);
  } catch (error) {
    return apiError(error.code || "VALIDATION_ERROR", error.code === "UNAUTHORIZED" ? "Invalid email or password" : error.message, error.code === "RATE_LIMITED" ? 429 : 400);
  }
}
