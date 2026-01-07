import { validateInviteToken } from "@/modules/invites/service";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    console.log("inside the validate invite token function");

    const { token } = await params;
    const result = await validateInviteToken(token);

    if (!result.valid) {
        return failure(`Invite invalid: ${result.reason}`, 400);
    }

    return success(result.invite);
}
