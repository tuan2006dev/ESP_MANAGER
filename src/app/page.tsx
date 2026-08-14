import Link from "next/link";
import { Shield, Trophy, Users, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getPublicData() {
  try {
    const teams = await prisma.team.findMany({
      where: { status: "ACTIVE" },
      include: {
        members: { where: { isActive: true } },
        taskTeams: {
          where: { matchResult: { isNot: null } },
          include: { matchResult: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const teamsWithStats = teams.map((team) => {
      const results = team.taskTeams
        .map((tt) => tt.matchResult)
        .filter(Boolean);
      const totalMatches = results.length;
      const wins = results.filter((r) => r!.resultType === "WIN").length;
      const top3 = results.filter((r) =>
        ["WIN", "TOP_2", "TOP_3"].includes(r!.resultType)
      ).length;
      const totalKills = results.reduce((sum, r) => sum + r!.totalKills, 0);
      const winrate =
        totalMatches > 0
          ? Math.round((wins / totalMatches) * 10000) / 100
          : 0;

      return {
        id: team.id,
        name: team.name,
        logo: team.logo,
        memberCount: team.members.length,
        totalMatches,
        wins,
        top3,
        totalKills,
        winrate,
      };
    });

    teamsWithStats.sort((a, b) => b.winrate - a.winrate);

    return { teams: teamsWithStats };
  } catch (err) {
    console.error("Lỗi tải dữ liệu công khai:", err);
    return { teams: [] };
  }
}

export default async function HomePage() {
  const { teams } = await getPublicData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">ESP Manager</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/ranking"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ranking
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
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <Zap className="h-3 w-3" />
            Hệ thống Quản lý Đội Esports Nội bộ
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1]">
            <span className="gradient-text">Quản lý Đội tuyển</span>
            <br />
            <span className="text-foreground">chuyên nghiệp</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Theo dõi hiệu suất, quản lý nhiệm vụ, báo cáo kết quả và thống kê
            chi tiết cho toàn bộ đội tuyển Esports của tổ chức.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 glow-primary"
              >
                Truy cập hệ thống
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/ranking">
              <Button
                variant="outline"
                size="lg"
                className="border-border/50 hover:bg-accent"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Xem Ranking
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Teams Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Đội tuyển</h2>
          <p className="text-muted-foreground mt-2">
            Các đội tuyển thuộc tổ chức
          </p>
        </div>

        {teams.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Chưa có đội tuyển nào.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="bg-card/80 border-border/40 hover:border-primary/30 stat-card"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.memberCount} thành viên
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-accent/30">
                      <p className="text-lg font-bold">{team.totalMatches}</p>
                      <p className="text-[10px] text-muted-foreground">Trận</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-accent/30">
                      <p className="text-lg font-bold text-emerald-400">
                        {team.winrate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Winrate
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-accent/30">
                      <p className="text-lg font-bold text-amber-400">
                        {team.totalKills}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Kills</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ESP Manager. Powered by{" "}
            <span className="gradient-text font-semibold">
              Esports Organization
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
