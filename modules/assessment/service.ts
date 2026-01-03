import prisma from "@/app/lib/db";


export async function createAssessmentService(
    jobId:string,
    type:"MCQ" | "CODING",
    config:any

){
    return prisma.assessment.create({
        data:{
            jobId,
            type,
            config,
        }
    })
}