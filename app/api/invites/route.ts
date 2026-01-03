import { createInviteController } from "@/modules/invites/controller";
import { success } from "@/utils/response";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { jobId, email } = await req.json();
  const invite = await createInviteController(jobId, email);
  return success(invite);
}
