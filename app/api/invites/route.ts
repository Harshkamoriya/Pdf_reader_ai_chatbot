import { createInviteController, listUserInvitesController } from "@/modules/invites/controller";
import { failure, success } from "@/utils/response";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { jobId, email } = await req.json();
  const invite = await createInviteController(jobId, email);
  return success(invite);
}

export async function GET() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  
  if (!email) return failure("Unauthorized", 401);

  const invites = await listUserInvitesController(email);
  return success(invites);
}
