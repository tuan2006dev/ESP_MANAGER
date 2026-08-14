import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MembersList } from "@/components/admin/members-list";

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [members, teams] = await Promise.all([
    prisma.teamMember.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true, role: true } },
        team: { select: { id: true, name: true } },
        playerResults: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    }),
  ]);

  return <MembersList members={members} teams={teams} />;
}
