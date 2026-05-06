import { envStatus } from "@/lib/api/config";
import { json } from "@/lib/api/http";

export async function GET() {
  return json({
    status: "ok",
    service: "SmartReview AI",
    env: envStatus(),
  });
}
