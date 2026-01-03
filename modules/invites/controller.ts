import { createInviteService, listInvitesService } from "./service";


export async function createInviteController(jobId :string , email : string){
    return createInviteService(jobId , email);
}   

export async function listInvitesController(jobId :string){
    return listInvitesService(jobId);
}