import prisma from "@/app/lib/db";



export async function createJobService(data: any, recruiterId: string) {
  return prisma.job.create({
    data: {
      ...data,
      createdBy: recruiterId,
    },
  });
}

export async function listJobsService(recruiterId: string) {
  return prisma.job.findMany({
    where: { createdBy: recruiterId },
  });
}
