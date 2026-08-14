import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const egoTeam = await prisma.team.findUnique({
    where: { name: "EGO ESP" },
    include: { members: { include: { user: true } } },
  });

  if (!egoTeam) return;

  for (const m of egoTeam.members) {
    if (m.user.email === "egobao" || m.user.name === "Bảo" || m.nickname === "Zeus.vn⁴⁴⁴") {
      await prisma.user.update({
        where: { id: m.userId },
        data: { role: Role.TEAM_CAPTAIN },
      });
      console.log(`✅ Đã bổ nhiệm: ${m.nickname} (${m.user.name}) làm Đội trưởng EGO ESP`);
    } else {
      await prisma.user.update({
        where: { id: m.userId },
        data: { role: Role.MEMBER },
      });
    }
  }
}

main().then(() => prisma.$disconnect());
