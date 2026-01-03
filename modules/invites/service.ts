import prisma from "@/app/lib/db";
import crypto from 'crypto'

export async function createInviteService(jobId :string , email : string){
    return prisma.invite.create({
        data:{
            jobId,
            email,
            token:crypto.randomBytes(16).toString('hex'),
            expiresAt : new Date(Date.now() + 3 * 24 *60*60*1000),
            createdAt : new Date(),

        }
    })
}

export async function listInvitesService(jobId :string){
    return prisma.invite.findMany({
        where:{jobId}
    })
}

export async function validateInviteToken(token : string){
    const invite  = await prisma.invite.findUnique({
        where:{token},
        include:{job :true},
    })

    if(!invite)return {valid:false , reason :"NOT_FOUND"};
    if(invite.status !== "PENDING")return {valid :false , reason :"USED"}
    if(invite.expiresAt < new Date()) return {valid :false , reason:"EXPIRED"};

    return {valid :true , invite};
}
export async function consumeInvite(
  token: string,
  userId: string
) {
  return prisma.$transaction(async tx => {
    const invite = await tx.invite.findUnique({
      where: { token },
    });

    if (!invite || invite.status !== "PENDING") {
      throw new Error("Invite invalid");
    }

    await tx.invite.update({
      where: { token },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });

    // Create  interview session
    const session = await tx.interviewSession.create({
      data: {
        userId,
        jobId: invite.jobId,
        status: "PENDING",
        createdAt: new Date(),
      },
    });

    return session;
  });
}
