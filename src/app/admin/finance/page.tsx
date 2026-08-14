import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceManager } from "@/components/admin/finance-manager";

export default async function AdminFinancePage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [revenues, expenses, salaries, bonuses, teams, matchTeams] = await Promise.all([
    prisma.revenue.findMany({
      include: { team: true },
      orderBy: { date: "desc" },
    }),
    prisma.expense.findMany({
      include: { team: true },
      orderBy: { date: "desc" },
    }),
    prisma.salary.findMany({
      include: { team: true },
      orderBy: { month: "desc" },
    }),
    prisma.bonus.findMany({
      include: { team: true },
      orderBy: { month: "desc" },
    }),
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.taskTeam.findMany({
      where: {
        status: "APPROVED",
        matchResult: { isNot: null },
      },
      include: {
        task: true,
        team: true,
        matchResult: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
  const totalSalary = salaries
    .filter((s) => s.status === "PAID" || s.status === "APPROVED")
    .reduce((s, r) => s + r.amount, 0);
  const totalBonus = bonuses
    .filter((b) => b.status === "PAID" || b.status === "APPROVED")
    .reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalSalary - totalBonus - totalExpense;

  // Calculate total match entry fees spent
  const totalMatchFeeSpent = matchTeams.reduce((s, mt) => s + (mt.task.entryFee || 0), 0);
  const totalMatchPrizeWon = matchTeams.reduce((s, mt) => s + (mt.matchResult?.prizeMoney || 0), 0);

  return (
    <FinanceManager
      revenues={revenues}
      expenses={expenses}
      salaries={salaries}
      bonuses={bonuses}
      teams={teams}
      matchTeams={matchTeams}
      summary={{
        totalRevenue,
        totalSalary,
        totalBonus,
        totalExpense,
        profit,
        totalMatchFeeSpent,
        totalMatchPrizeWon,
      }}
    />
  );
}
