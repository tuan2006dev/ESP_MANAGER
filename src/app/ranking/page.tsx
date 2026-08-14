import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { RankingTable } from "@/components/common/ranking-table";

export const dynamic = "force-dynamic";

export default async function PublicRankingPage() {
  let teams: any[] = [];
  let targetWinrate = 70;

  try {
    const [fetchedTeams, setting] = await Promise.all([
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
    teams = fetchedTeams;
    if (setting) targetWinrate = Number(setting.value);
  } catch (err) {
    console.error("Lỗi tải ranking:", err);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">ESP Manager</span>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              Đăng nhập
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Bảng Xếp Hạng Đội Tuyển
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thành tích và xếp hạng chính thức các đội thuộc tổ chức
            </p>
          </div>
        </div>

        <RankingTable teams={teams} targetWinrate={targetWinrate} />
      </main>
    </div>
  );
}
