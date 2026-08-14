import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { TeamProfileView } from "@/components/admin/team-profile-view";

export default async function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: { name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      taskTeams: {
        include: {
          task: true,
          matchResult: true,
        },
        orderBy: { createdAt: "desc" },
      },
      violations: {
        include: { teamMember: true },
        orderBy: { date: "desc" },
      },
      salaries: {
        orderBy: { month: "desc" },
      },
      bonuses: {
        include: { teamMember: true },
        orderBy: { createdAt: "desc" },
      },
      revenues: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!team) notFound();

  return <TeamProfileView team={team} />;
}
