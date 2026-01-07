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

export async function getInterviewStateService(id: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      job: {
        include: {
          rounds: {
            orderBy: { order: 'asc' }
          }
        }
      },
      roundSessions: {
        include: {
          round: true
        },
        orderBy: { round: { order: 'asc' } }
      }
    }
  });

  if (!session || !session.job) {
    throw new Error("Session or Job not found");
  }

  // Find first incomplete round session
  let currentRoundSession = session.roundSessions.find(
    rs => rs.status === 'PENDING' || rs.status === 'IN_PROGRESS'
  );
  
  // If no active round session, look for the first round that hasn't started
  if (!currentRoundSession) {
    const completedRoundIds = session.roundSessions.map(rs => rs.roundId);
    const nextRound = session.job.rounds.find(r => !completedRoundIds.includes(r.id));
    
    if (nextRound) {
      // Create a new round session for this round
      currentRoundSession = await prisma.roundSession.create({
        data: {
          interviewSessionId: id,
          roundId: nextRound.id,
          status: 'PENDING'
        },
        include: {
          round: true
        }
      });
    }
  }

  if (!currentRoundSession) {
    return { 
      status: session.status, 
      isCompleted: true,
      message: 'Interview already completed' 
    };
  }

  return {
    status: session.status,
    isCompleted: false,
    currentRound: {
      roundSessionId: currentRoundSession.id,
      roundType: currentRoundSession.round.roundType,
      order: currentRoundSession.round.order
    }
  };
}
