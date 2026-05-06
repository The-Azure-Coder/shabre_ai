import { apiError, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/route-auth";
import { toPublicJob } from "@/lib/api/document-service";
import { prisma } from "@/lib/api/store";

export async function GET(request, { params }) {
  try {
    const user = await requireUser(request);
    const { jobId } = await params;
    const job = await prisma.job.findFirst({ where: { id: jobId, ownerId: user.id } });
    if (!job) {
      return apiError("JOB_NOT_FOUND", "Job not found", 404);
    }
    return json(toPublicJob(job));
  } catch (error) {
    return apiError(error.code || "UNAUTHORIZED", error.message, 401);
  }
}
