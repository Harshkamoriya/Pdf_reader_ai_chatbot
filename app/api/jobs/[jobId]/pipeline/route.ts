import { getJobPipeline } from "@/modules/jobs/pipeline.service";


export async function GET(
    _:Request,{params}:{params: Promise<{jobId:string}>}
){
    const { jobId } = await params;
    const pipeline = await getJobPipeline(jobId);
    return Response.json({success:true , pipeline});
}
