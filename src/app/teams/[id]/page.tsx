import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ArrowLeft, Users, Calendar, Trophy, Crosshair, TrendingUp } from "lucide-react";
import {
  formatDate,
  calculateWinrate,
  calculateTop3Rate,
  calculateAverageKills,
  getPerformanceLabel,
} from "@/lib/utils";

export default async function PublicTeamProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: { select: { name: true, role: true } },
          playerResults: true,
        },
      },
      taskTeams: {
        where: { status: "APPROVED", matchResult: { isNot: null } },
        include: {
          task: true,
          matchResult: {
            include: { playerResults: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!team) notFound();

  const results = team.taskTeams
    .map((tt) => tt.matchResult)
    .filter(Boolean);

  const totalMatches = results.length;
  const wins = results.filter((r) => r!.resultType === "WIN").length;
  const top3 = results.filter((r) =>
    ["WIN", "TOP_2", "TOP_3"].includes(r!.resultType)
  ).length;
  const totalKills = results.reduce(
    (sum, r) => sum + (r?.totalKills || 0),
    0
  );
  const winrate = calculateWinrate(wins, totalMatches);
  const top3Rate = calculateTop3Rate(top3, totalMatches);
  const avgKills = calculateAverageKills(totalKills, totalMatches);
  const performance = getPerformanceLabel(winrate);

  const captain = team.members.find((m) => m.user.role === "TEAM_CAPTAIN");

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
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-primary/30 text-primary">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-2xl glow-primary">
              {team.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black">{team.name}</h1>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  {team.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Đội trưởng: <strong className="text-foreground">{captain?.nickname || "Chưa có"}</strong> • Ngày thành lập: {formatDate(team.joinDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Public Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-card/60 border-border/40 text-center">
            <p className="text-xs text-muted-foreground">Tổng Trận Đấu</p>
            <p className="text-2xl font-bold mt-1">{totalMatches}</p>
          </Card>
          <Card className="p-4 bg-card/60 border-border/40 text-center">
            <p className="text-xs text-muted-foreground">Chiến Thắng (Wins)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{wins}</p>
          </Card>
          <Card className="p-4 bg-card/60 border-border/40 text-center">
            <p className="text-xs text-muted-foreground">Tỷ Lệ Thắng (Winrate)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{winrate}%</p>
            <p className={`text-[10px] font-bold ${performance.color}`}>{performance.label}</p>
          </Card>
          <Card className="p-4 bg-card/60 border-border/40 text-center">
            <p className="text-xs text-muted-foreground">Tổng Kills</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{totalKills}</p>
            <p className="text-[10px] text-muted-foreground">{avgKills} kills/trận</p>
          </Card>
        </div>

        {/* Members Roster */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Đội hình Thi đấu
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.members.map((m) => {
              const kills = m.playerResults.reduce((sum, r) => sum + r.kills, 0);
              return (
                <Card key={m.id} className="p-4 bg-card/60 border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-primary">
                      {m.nickname.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{m.nickname}</p>
                      <p className="text-xs text-muted-foreground">{m.user.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {m.user.role === "TEAM_CAPTAIN" ? "Đội trưởng" : "Tuyển thủ"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Match History */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Lịch sử Kết quả Thi đấu
          </h2>
          <Card className="border-border/40 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhiệm vụ / Giải đấu</TableHead>
                  <TableHead>Ngày thi đấu</TableHead>
                  <TableHead>Map</TableHead>
                  <TableHead className="text-center">Kết quả</TableHead>
                  <TableHead className="text-center">Hạng</TableHead>
                  <TableHead className="text-right">Kills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.taskTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Chưa có kết quả trận đấu nào được ghi nhận.
                    </TableCell>
                  </TableRow>
                ) : (
                  team.taskTeams.map((tt) => (
                    <TableRow key={tt.id}>
                      <TableCell className="font-bold">{tt.task.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(tt.task.date)}
                      </TableCell>
                      <TableCell className="text-xs">{tt.task.map || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            tt.matchResult?.resultType === "WIN"
                              ? "bg-emerald-500 text-white font-bold"
                              : "bg-accent text-foreground"
                          }
                        >
                          {tt.matchResult?.resultType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        #{tt.matchResult?.rank}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-400">
                        {tt.matchResult?.totalKills}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}
