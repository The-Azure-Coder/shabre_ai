import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";

export async function GET(request) {
  try {
    const user = await requireUser(request);
    return json({
      profile: {
        name: user.name,
        email: user.email,
        role: "Student",
      },
      preferences: {
        language: "English",
        notifications: true,
        autoSave: true,
        suggestions: true,
      },
    });
  } catch (error) {
    return apiError(error.code || "UNAUTHORIZED", error.message, 401);
  }
}
