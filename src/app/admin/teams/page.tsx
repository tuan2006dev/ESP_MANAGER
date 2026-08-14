import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeamsList } from "@/components/admin/teams-list";

export default async function AdminTeamsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const teams = await prisma.team.findMany({
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: { name: true, role: true, email: true },
          },
        },
      },
      taskTeams: {
        include: {
          matchResult: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <TeamsList teams={teams} />;
}
