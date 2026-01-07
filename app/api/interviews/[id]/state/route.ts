import prisma from "@/app/lib/db";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (!session || !session.job) return failure("Session or Job not found", 404);

    // Find first incomplete round session
    let currentRoundSession = session.roundSessions.find(rs => rs.status === 'PENDING' || rs.status === 'IN_PROGRESS');
    
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
        return success({ status: 'COMPLETED', message: 'Interview already completed' });
    }

    return success({
      status: session.status,
      currentRound: {
        roundSessionId: currentRoundSession.id,
        roundType: currentRoundSession.round.roundType,
        order: currentRoundSession.round.order
      }
    });
  } catch (err: any) {
    console.error("[Interview State API Error]:", err);
    return failure("Failed to fetch interview state", 500);
  }
}
