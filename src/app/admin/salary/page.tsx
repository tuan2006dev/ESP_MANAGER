import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SalaryManager } from "@/components/admin/salary-manager";

export default async function AdminSalaryPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [policy, teams, salaries] = await Promise.all([
    prisma.salaryPolicy.findFirst({
      where: { isActive: true },
    }),
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      include: {
        members: { where: { isActive: true } },
        taskTeams: {
          include: { task: true, matchResult: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.salary.findMany({
      include: { team: true },
    }),
  ]);

  return <SalaryManager policy={policy} teams={teams} salaries={salaries} />;
}
