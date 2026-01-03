import { getJobPipeline } from "@/modules/jobs/pipeline.service";


export async function GET(
    _:Request,{params}:{params:{jobId:string}}
){
    const pipeline = await getJobPipeline(params.jobId);
    return Response.json({success:true , pipeline});
}

