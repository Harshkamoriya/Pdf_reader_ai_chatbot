import prisma from "@/app/lib/db";

export async function startRound(
  interviewSessionId: string,
  roundId: string
) {
  return prisma.roundSession.create({
    data: {
      interviewSessionId,
      roundId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });
}


export async function endRound(
  roundSessionId: string,
  payload: {
    score: number;
    transcript?: any;
    answers?: any;
    cheatingScore?: number;
  }
) {
  return prisma.roundSession.update({
    where: { id: roundSessionId },
    data: {
      status: "ENDED",
      score: payload.score,
      transcript: payload.transcript,
      answers: payload.answers,
      cheatingScore: payload.cheatingScore,
      endedAt: new Date(),
    },
  });
}

export async function getNextRoundId(interviewSessionId: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: interviewSessionId },
    include: {
      job: {
        include: {
          rounds: { orderBy: { order: "asc" } },
        },
      },
      roundSessions: true,
    },
  });

  if (!session || !session.job) return null;

  const completedRoundIds = new Set(session.roundSessions.map((rs) => rs.roundId));
  const nextRound = session.job.rounds.find((r) => !completedRoundIds.has(r.id));

  return nextRound ? nextRound.id : null;
}
