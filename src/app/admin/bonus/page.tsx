import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BonusManager } from "@/components/admin/bonus-manager";

export default async function AdminBonusPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [bonuses, teams] = await Promise.all([
    prisma.bonus.findMany({
      include: { team: true, teamMember: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <BonusManager bonuses={bonuses} teams={teams} />;
}
