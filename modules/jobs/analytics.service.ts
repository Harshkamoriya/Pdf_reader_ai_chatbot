import prisma from "@/app/lib/db";

export async function getJobAnalyticsService(jobId: string) {
  const [job, applicants] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
      include: { rounds: true },
    }),
    prisma.interviewSession.findMany({
      where: { jobId },
      include: { 
        roundSessions: {
            include: { proctoringEvents: true }
        } 
      },
    }),
  ]);

  if (!job) throw new Error("Job not found");

  const totalApplicants = applicants.length;
  const inProgress = applicants.filter(a => a.status === "PENDING" || a.status === "IN_PROGRESS").length;
  const completed = applicants.filter(a => a.status === "ENDED").length;

  const roundStats = job.rounds.map(round => {
    const roundSessions = applicants.flatMap(a => a.roundSessions.filter(rs => rs.roundId === round.id));
    const avgScore = roundSessions.length > 0 
      ? roundSessions.reduce((acc, rs) => acc + (rs.score || 0), 0) / roundSessions.length 
      : 0;
    
    return {
      roundType: round.roundType,
      avgScore,
      participants: roundSessions.length,
    };
  });

  return {
    totalApplicants,
    inProgress,
    completed,
    roundStats,
  };
}
