import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.driver.updateMany({
    where: { safetyScore: 0 },
    data: { safetyScore: 100 },
  });
  console.log("Updated driver safety scores to 100.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
