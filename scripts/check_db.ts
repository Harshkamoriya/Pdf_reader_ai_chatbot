import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 'mock-candidate-id' },
  });
  console.log('Mock User:', user);

  const allUsers = await prisma.user.findMany({ take: 5 });
  console.log('Some Users:', allUsers.map(u => ({ id: u.id, email: u.email })));

  const allInvites = await prisma.invite.findMany({ take: 5, include: { job: true } });
  console.log('Some Invites:', allInvites.map(i => ({ token: i.token, jobId: i.jobId, companyId: i.job.companyId })));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
