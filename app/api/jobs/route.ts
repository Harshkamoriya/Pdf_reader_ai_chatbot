import { NextRequest } from "next/server";
import { ratelimit } from "@/infra/rate-limit";

import { failure, success } from "@/utils/response";
import { createJobController } from "@/modules/jobs/controller";

export async function POST(req: NextRequest) {
  const allowed = await ratelimit("create-job", 10, 60);
  if (!allowed) return failure("Rate limit exceeded", 429);

  const body = await req.json();
  const recruiterId = "mock-recruiter-id"; // Clerk later

  const job = await createJobController(body, recruiterId);
  return success(job);
}
