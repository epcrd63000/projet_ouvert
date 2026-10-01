import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { SEED_PROJECT } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.project.updateMany({
    where: { id: SEED_PROJECT.id },
    data: { totalBudget: SEED_PROJECT.totalBudget },
  });

  if (result.count !== 1) {
    throw new Error(
      `Expected to update one project (${SEED_PROJECT.id}), updated ${result.count}.`
    );
  }

  console.log(`Project funding ceiling set to ${SEED_PROJECT.totalBudget} EUR.`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed to update the project funding ceiling:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
