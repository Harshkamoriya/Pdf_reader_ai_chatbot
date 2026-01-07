import { createAssessmentService } from "@/modules/assessment/service";
import { NextRequest, NextResponse } from "next/server";


export async function POST(
    req:NextRequest,{params}:{params: Promise<{jobId:string}>}
){
    const { jobId } = await params;
    const {type , config} = await req.json();
    const assessment  = await createAssessmentService(jobId , type, config);
    return NextResponse.json({success:true, assessment})
}