import { createAssessmentService } from "@/modules/assessment/service";
import { NextRequest, NextResponse } from "next/server";


export async function POST(
    req:NextRequest,{params}:{params:{jobId:string}}
){

    const {type , config} = await req.json();
    const assessment  = await createAssessmentService(params.jobId , type, config);
    return NextResponse.json({success:true, assessment})
}