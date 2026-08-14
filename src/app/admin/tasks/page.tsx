import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TasksList } from "@/components/admin/tasks-list";

export default async function AdminTasksPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [tasks, teams] = await Promise.all([
    prisma.task.findMany({
      include: {
        taskTeams: {
          include: {
            team: true,
            matchResult: true,
          },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <TasksList tasks={tasks} teams={teams} />;
}
