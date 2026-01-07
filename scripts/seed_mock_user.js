const { PrismaClient } = require("./app/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: "mock-candidate-id" },
    update: {},
    create: {
      id: "mock-candidate-id",
      clerkId: "mock-clerk-id",
      email: "mock-candidate@example.com",
      name: "Mock Candidate",
      role: "CANDIDATE",
    },
  });
  console.log("User created/found:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
