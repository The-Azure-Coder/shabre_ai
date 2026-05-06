import { apiError, json } from "@/lib/api/http";
import { assertRateLimit } from "@/lib/api/security";
import { loginSchema } from "@/lib/api/schemas";
import { loginUser } from "@/lib/api/auth-service";

export async function POST(request) {
  try {
    assertRateLimit(`login:${request.headers.get("x-forwarded-for") || "local"}`, 12);
    const input = loginSchema.parse(await request.json());
    return json(await loginUser(input));
  } catch (error) {
    const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "RATE_LIMITED" ? 429 : 400;
    return apiError(error.code || "VALIDATION_ERROR", error.code === "UNAUTHORIZED" ? "Invalid email or password" : error.message, status);
  }
}
