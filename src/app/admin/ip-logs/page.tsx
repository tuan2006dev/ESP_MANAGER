import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { IpLogsTable } from "./ip-logs-table";

export const metadata = {
  title: "Quản lý IP | ESP Manager",
};

export default async function IpLogsPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all user IPs
  const userIps = await prisma.userIP.findMany({
    include: {
      user: {
        include: {
          teamMembers: {
            include: {
              team: true,
            },
            where: { isActive: true }, // Optional: only active team
          },
        },
      },
    },
    orderBy: {
      lastSeen: "desc",
    },
  });

  // Fetch all banned IPs
  const bannedIps = await prisma.bannedIP.findMany();

  // Combine data
  const data = userIps.map((log) => {
    const isBanned = bannedIps.some((b) => b.ip === log.ip);
    const teamName = log.user.teamMembers[0]?.team.name || "Không có đội";
    return {
      id: log.id,
      ip: log.ip,
      userName: log.user.name,
      teamName: teamName,
      lastSeen: log.lastSeen,
      isBanned,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch sử truy cập IP</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi địa chỉ IP của người dùng và quản lý danh sách cấm.
          </p>
        </div>
      </div>
      
      <IpLogsTable data={data} />
    </div>
  );
}
