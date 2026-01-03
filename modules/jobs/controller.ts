import { createJobService, listJobsService } from "./service";


export async function createJobController(data:any, recruiterId:string){
    return createJobService(data , recruiterId);
}

export async function listJobsController(recruiterId :string){
    return listJobsService(recruiterId);
}