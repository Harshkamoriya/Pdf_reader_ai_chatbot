import { createInviteService, listInvitesService, listUserInvitesService } from "./service";


export async function createInviteController(jobId :string , email : string){
    return createInviteService(jobId , email);
}   

export async function listInvitesController(jobId :string){
    return listInvitesService(jobId);
}

export async function listUserInvitesController(email: string) {
    return listUserInvitesService(email);
}