import { consumeInvite } from "@/modules/invites/service";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";


export async function POST(req: NextRequest){

    const body  = await req.formData();
    const token = body.get("token") as string

    const userId = "mock-candidate-id";

    try {
        const session = await consumeInvite(token , userId);
        return success( session);

    } catch (error) {
        return failure("Invite already used or invalid ", 400)
        
    }

}