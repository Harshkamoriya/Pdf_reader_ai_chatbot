import prisma from "@/app/lib/db";


export async function createJobService(data: any, recruiterId: string) {
  try {
    // Ensure the company exists (Foreign Key fix)
    if (data.companyId) {
        await prisma.company.upsert({
            where: { id: data.companyId },
            update: {},
            create: {
                id: data.companyId,
                name: "Mock Company",
            }
        });
    }

    console.log("[createJobService] Creating job with data:", JSON.stringify(data, null, 2));
    const job = await prisma.job.create({
      data: {
        ...data,
        createdBy: recruiterId,
      },
    });
    console.log("[createJobService] Success:", job.id);
    return job;
  } catch (err) {
    console.error("[createJobService] Prisma Error:", err);
    throw err;
  }
}

export async function listJobsService(recruiterId: string) {
  return prisma.job.findMany({
    where: { createdBy: recruiterId },
  });
}
