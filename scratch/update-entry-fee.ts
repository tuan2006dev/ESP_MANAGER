import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const cusTask = await prisma.task.findFirst({
    where: { name: { contains: "Cus 20k" } },
    include: { taskTeams: true },
  });

  if (cusTask) {
    await prisma.task.update({
      where: { id: cusTask.id },
      data: { entryFee: 20000 },
    });
    console.log("✅ Updated Cus 20k entryFee = 20000");

    for (const tt of cusTask.taskTeams) {
      await prisma.expense.create({
        data: {
          teamId: tt.teamId,
          amount: 20000,
          category: "ENTRY_FEE",
          date: cusTask.date,
          note: `Tiền đăng ký / Phí slot giải: ${cusTask.name}`,
        },
      });
      console.log(`✅ Created Expense for teamId: ${tt.teamId}`);
    }
  }
}

main().then(() => prisma.$disconnect());
