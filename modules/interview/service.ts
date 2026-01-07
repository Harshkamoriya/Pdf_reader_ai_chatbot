import prisma from "@/app/lib/db";


export async function createInterviewRounds(
    jobId:string,
    rounds:{
        roundType: string;
        order : number ;
        weight: number;
        config: any;
    }[]
){

    return prisma.$transaction(
        rounds.map(round=>
            prisma.interviewRound.create({
                data:{
                    jobId,
                    roundType: round.roundType,
                    order:round.order,
                    weight:round.weight,
                    config:round.config
                }
            })
        )
    )
}

