import prisma from "@/app/lib/db";

export async function getJobPipeline(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      rounds: { orderBy: { order: "asc" } },
      invites: true,
    },
  });
}
