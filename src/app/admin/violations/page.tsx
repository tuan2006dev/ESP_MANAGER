import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ViolationsManager } from "@/components/admin/violations-manager";

export default async function AdminViolationsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [violations, teams] = await Promise.all([
    prisma.violation.findMany({
      include: { team: true, teamMember: true },
      orderBy: { date: "desc" },
    }),
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <ViolationsManager violations={violations} teams={teams} />;
}
