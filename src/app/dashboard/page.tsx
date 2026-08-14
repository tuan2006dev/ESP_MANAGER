import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemberDashboard } from "@/components/member/member-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role === "TEAM_CAPTAIN") {
    redirect("/captain");
  }

  // Find member profile
  const member = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      team: {
        include: {
          taskTeams: {
            include: {
              task: true,
              matchResult: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      playerResults: {
        include: {
          matchResult: true,
        },
      },
    },
  });

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-destructive">
            Tài khoản chưa được gán vào Đội tuyển!
          </h1>
          <p className="text-sm text-muted-foreground">
            Vui lòng liên hệ Admin / BTC để được gán vào đội tuyển Esports.
          </p>
        </div>
      </div>
    );
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <MemberDashboard
      member={member}
      user={session.user}
      notifications={notifications}
    />
  );
}
