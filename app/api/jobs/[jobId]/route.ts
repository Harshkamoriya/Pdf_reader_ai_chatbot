import { createInterviewRounds } from "@/modules/interview/service";
import { NextRequest } from "next/server";


export async function POST(
    req: NextRequest,{params}:{params: Promise<{jobId:string}>}
){
const { jobId } = await params;
const rounds = await req.json();

const data = await createInterviewRounds(jobId , rounds);
return Response.json({success:true , data})

}

