import prisma from "@/app/lib/db";
import { failure, success } from "@/utils/response";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return failure("Unauthorized", 401);

    const sessions = await prisma.interviewSession.findMany({
      where: { userId: user.id },
      include: {
        job: true,
        roundSessions: {
            orderBy: { startedAt: 'desc' },
            take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return success(sessions);
  } catch (err: any) {
    console.error("[Candidate Sessions API Error]:", err);
    return failure("Failed to fetch sessions", 500);
  }
}
