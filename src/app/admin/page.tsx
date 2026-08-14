import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";

async function getDashboardData() {
  const currentMonth = getCurrentMonth();

  const [
    totalTeams,
    activeTeams,
    totalTasks,
    todayTasks,
    completedTaskTeams,
    pendingTaskTeams,
    allMatchResults,
    monthRevenue,
    monthSalary,
    monthBonus,
    monthExpense,
  ] = await Promise.all([
    prisma.team.count(),
    prisma.team.count({ where: { status: "ACTIVE" } }),
    prisma.task.count(),
    prisma.task.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.taskTeam.count({ where: { status: "APPROVED" } }),
    prisma.taskTeam.count({
      where: { status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] } },
    }),
    prisma.matchResult.findMany({
      select: { totalKills: true, resultType: true },
    }),
    prisma.revenue.aggregate({
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(`${currentMonth}-01`),
        },
      },
    }),
    prisma.salary.aggregate({
      _sum: { amount: true },
      where: { month: currentMonth },
    }),
    prisma.bonus.aggregate({
      _sum: { amount: true },
      where: { month: currentMonth },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: {
          gte: new Date(`${currentMonth}-01`),
        },
      },
    }),
  ]);

  const totalMatches = allMatchResults.length;
  const totalWins = allMatchResults.filter(
    (r) => r.resultType === "WIN"
  ).length;
  const totalKills = allMatchResults.reduce(
    (sum, r) => sum + r.totalKills,
    0
  );
  const avgWinrate =
    totalMatches > 0
      ? Math.round((totalWins / totalMatches) * 10000) / 100
      : 0;

  const revenue = monthRevenue._sum.amount ?? 0;
  const salary = monthSalary._sum.amount ?? 0;
  const bonus = monthBonus._sum.amount ?? 0;
  const expense = monthExpense._sum.amount ?? 0;
  const profit = revenue - salary - bonus - expense;

  return {
    totalTeams,
    activeTeams,
    todayTasks,
    totalTasks,
    completedTaskTeams,
    pendingTaskTeams,
    totalMatches,
    avgWinrate,
    totalKills,
    revenue,
    salary,
    bonus,
    expense,
    profit,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan hoạt động tổ chức Esports
        </p>
      </div>

      <DashboardStats data={data} />
    </div>
  );
}
