// /app/lib/interviewUtils.ts
import prisma from './db';

export async function updateSession(sessionId: string, transcript: any[], questionQueue: any[], scores: any[]) {
  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: { transcript, questionQueue, scores, updatedAt: new Date() },
  });
}

export async function endInterview(sessionId: string, transcript: any[], scores: any[]) {
  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      transcript,
      scores,
      status: 'ENDED',
      endedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
