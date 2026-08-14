import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CaptainDashboard } from "@/components/captain/captain-dashboard";

export default async function CaptainPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Find the team of this captain
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      team: {
        include: {
          members: {
            where: { isActive: true },
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
          taskTeams: {
            include: {
              task: true,
              matchResult: {
                include: { playerResults: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          salaries: {
            orderBy: { month: "desc" },
          },
          bonuses: {
            orderBy: { createdAt: "desc" },
          },
          violations: {
            orderBy: { date: "desc" },
          },
        },
      },
    },
  });

  if (!teamMember) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-destructive">
            Bạn chưa được gán vào Đội tuyển nào!
          </h1>
          <p className="text-sm text-muted-foreground">
            Vui lòng liên hệ Admin / BTC để gán tài khoản vào đội tuyển.
          </p>
        </div>
      </div>
    );
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <CaptainDashboard
      team={teamMember.team}
      user={session.user}
      notifications={notifications}
    />
  );
}
