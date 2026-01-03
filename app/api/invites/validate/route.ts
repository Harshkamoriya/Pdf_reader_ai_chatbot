import { validateInviteToken } from "@/modules/invites/service";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";


export async function GET(req:NextRequest,

    {params}:{params:{token :string}}
){
    console.log("inside the validate invite token function")

    const {token} = params;
    const  result = await validateInviteToken(token)

    if(!result.valid){
        return failure(`invite invalid :${result.reason}`, 400)
    }

    return  success(result.invite);
    ;

}