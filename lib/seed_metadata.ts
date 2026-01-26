
import data from "./striver_a2z_metadata.json";
import prisma from "../app/lib/db";

async function seed() {
  try {
    for (const q of data) {
      await prisma.question.upsert({
        where: { id: q.id },
        update: {},
        create: q as any, // Cast as any if typing is strict and JSON parsing is needed
      });
    }
    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
