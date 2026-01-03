import { createInterviewRounds } from "@/modules/interview/service";
import { NextRequest } from "next/server";


export async function POST(
    req: NextRequest,{params}:{params:{jobId:string}}
){

const rounds = await req.json();

const data = await createInterviewRounds(params.jobId , rounds);
return Response.json({success:true , data})

}

