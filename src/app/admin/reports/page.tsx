import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsList } from "@/components/admin/reports-list";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const reports = await prisma.matchResult.findMany({
    include: {
      taskTeam: {
        include: {
          team: true,
          task: true,
        },
      },
      approvedBy: {
        select: { name: true },
      },
      playerResults: {
        include: {
          teamMember: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return <ReportsList reports={reports} />;
}
