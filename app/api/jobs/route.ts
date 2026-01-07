import { NextRequest } from "next/server";
import { ratelimit } from "@/infra/rate-limit";

import { failure, success } from "@/utils/response";
import { createJobController, listJobsController } from "@/modules/jobs/controller";

import { createJobSchema } from "@/modules/jobs/schema";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const recruiterId = userId || "mock-recruiter-id";

  console.log(`[POST /api/jobs] Recruiter: ${recruiterId}`);

  try {
    const allowed = await ratelimit(`create-job-${recruiterId}`, 5, 3600); // 5 jobs per hour
    console.log(`[POST /api/jobs] Rate limit allowed: ${allowed}`);
    if (!allowed) return failure("Rate limit exceeded. Please try again later.", 429);

    const body = await req.json();
    console.log("[POST /api/jobs] Payload:", JSON.stringify(body, null, 2));
    
    // Validation
    const validatedData = createJobSchema.safeParse(body);
    if (!validatedData.success) {
        console.error("[POST /api/jobs] Validation Failed:", validatedData.error.errors);
        return failure(validatedData.error.errors[0].message, 400);
    }

    console.log("[POST /api/jobs] Validation Success. Creating job...");
    const job = await createJobController(validatedData.data, recruiterId);
    console.log("[POST /api/jobs] Job Created Successfully:", job.id);
    return success(job);
  } catch (err: any) {
    console.error("[POST /api/jobs] Error:", err);
    return failure(err.message || "Invalid request", 500);
  }
}

export async function GET() {
  const { userId } = await auth();
  const recruiterId = userId || "mock-recruiter-id";
  const jobs = await listJobsController(recruiterId);
  return success(jobs);
}
