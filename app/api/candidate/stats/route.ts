import prisma from "@/app/lib/db";
import { failure, success } from "@/utils/response";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return failure("Unauthorized", 401);

    const email = user.emailAddresses[0].emailAddress;

    // Fetch counts
    const [pendingInvites, inProgressSessions, completedSessions, roundSessions] = await Promise.all([
      prisma.invite.count({
        where: { email, status: "PENDING" }
      }),
      prisma.interviewSession.count({
        where: { user: { email }, status: "PENDING" }
      }),
      prisma.interviewSession.count({
        where: { user: { email }, status: "ENDED" }
      }),
      prisma.interviewSession.findMany({
        where: { user: { email } },
        orderBy: { startedAt: 'desc' },
        take: 1
      })
    ]);

    const session = roundSessions[0];

    return success({
      pendingInvites,
      inProgressSessions,
      completedSessions,
      roundSessions: [session].filter(Boolean)
    });
  } catch (err: any) {
    console.error("[Candidate Stats API Error]:", err);
    return failure("Failed to fetch statistics", 500);
  }
}
