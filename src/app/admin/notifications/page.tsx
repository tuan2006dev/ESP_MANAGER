import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationsManager } from "@/components/admin/notifications-manager";

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [notifications, teams] = await Promise.all([
    prisma.notification.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <NotificationsManager
      notifications={notifications}
      teams={teams}
    />
  );
}
