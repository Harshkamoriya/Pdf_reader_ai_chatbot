import prisma from "@/app/lib/db";

export async function getDetailedReportService(interviewId: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
    include: {
      user: true,
      job: { include: { rounds: true } },
      roundSessions: {
        include: {
          proctoringEvents: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { round: { order: "asc" } },
      },
    },
  });

  if (!session) throw new Error("Interview session not found");

  return session;
}
