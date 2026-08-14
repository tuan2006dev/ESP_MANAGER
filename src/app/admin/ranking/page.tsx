import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RankingTable } from "@/components/common/ranking-table";

export default async function AdminRankingPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [teams, setting] = await Promise.all([
    prisma.team.findMany({
      where: { status: "ACTIVE" },
      include: {
        members: { where: { isActive: true } },
        taskTeams: {
          include: { matchResult: true },
        },
      },
    }),
    prisma.systemSetting.findUnique({
      where: { key: "target_winrate" },
    }),
  ]);

  const targetWinrate = setting ? Number(setting.value) : 70;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">
          Bảng Xếp Hạng Nội Bộ (Internal Ranking)
        </h1>
        <p className="text-sm text-muted-foreground">
          Thứ hạng và hiệu suất các đội tuyển dựa trên các trận đấu đã được BTC duyệt kết quả
        </p>
      </div>

      <RankingTable teams={teams} targetWinrate={targetWinrate} />
    </div>
  );
}
