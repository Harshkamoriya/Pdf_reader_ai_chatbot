import { consumeInvite } from "@/modules/invites/service";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";


export async function POST(req: NextRequest){
    console.log("inside the consumeInvite route function")
    const body  = await req.formData();
    const token = body.get("token") as string

    try {
        console.log("inside the try block")
        const session = await consumeInvite(token);
        return success( session);

    } catch (error: any) {
        console.error("Error consuming invite:", error);
        return failure(`Invite consumption failed: ${error.message || error}`, 400);
    }

}