"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, Crosshair, TrendingUp } from "lucide-react";
import {
  calculateWinrate,
  calculateTop3Rate,
  calculateAverageKills,
  getPerformanceLabel,
} from "@/lib/utils";

interface RankingTableProps {
  teams: any[];
  targetWinrate?: number;
}

export function RankingTable({ teams, targetWinrate = 70 }: RankingTableProps) {
  // Compute rankings
  const rankedTeams = teams.map((team) => {
    // Only count APPROVED matches for official ranking
    const results = team.taskTeams
      .filter((tt: any) => tt.status === "APPROVED" && tt.matchResult)
      .map((tt: any) => tt.matchResult);

    const matches = results.length;
    const wins = results.filter((r: any) => r.resultType === "WIN").length;
    const top3 = results.filter((r: any) =>
      ["WIN", "TOP_2", "TOP_3"].includes(r.resultType)
    ).length;
    const kills = results.reduce((sum: number, r: any) => sum + r.totalKills, 0);
    const winrate = calculateWinrate(wins, matches);
    const top3Rate = calculateTop3Rate(top3, matches);
    const avgKills = calculateAverageKills(kills, matches);
    const performance = getPerformanceLabel(winrate, targetWinrate, 50);

    return {
      id: team.id,
      name: team.name,
      logo: team.logo,
      membersCount: team.members.length,
      matches,
      wins,
      winrate,
      top3,
      top3Rate,
      kills,
      avgKills,
      performance,
    };
  });

  // Sort by winrate DESC, then by kills DESC
  rankedTeams.sort((a, b) => {
    if (b.winrate !== a.winrate) return b.winrate - a.winrate;
    return b.kills - a.kills;
  });

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="flex items-center gap-1 font-black text-amber-400">
          <Trophy className="h-5 w-5 text-amber-400" /> #1
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="flex items-center gap-1 font-black text-slate-300">
          <Medal className="h-5 w-5 text-slate-300" /> #2
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="flex items-center gap-1 font-black text-amber-600">
          <Award className="h-5 w-5 text-amber-600" /> #3
        </div>
      );
    }
    return <span className="font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <Card className="border-border/40 bg-card/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Hạng</TableHead>
            <TableHead>Đội tuyển</TableHead>
            <TableHead className="text-center">Số trận</TableHead>
            <TableHead className="text-center">Thắng (Win)</TableHead>
            <TableHead className="text-center">Tỷ lệ thắng (Winrate)</TableHead>
            <TableHead className="text-center">TOP 3 (Rate)</TableHead>
            <TableHead className="text-center">Tổng Kills</TableHead>
            <TableHead className="text-center">Kills TB / Trận</TableHead>
            <TableHead className="text-right">Đánh giá Hiệu suất</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankedTeams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                Chưa có dữ liệu bảng xếp hạng.
              </TableCell>
            </TableRow>
          ) : (
            rankedTeams.map((team, index) => (
              <TableRow key={team.id} className={index === 0 ? "bg-amber-500/5" : ""}>
                <TableCell>{getRankBadge(index)}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{team.name}</p>
                      <p className="text-[11px] text-muted-foreground">{team.membersCount} thành viên</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-center font-semibold">{team.matches}</TableCell>

                <TableCell className="text-center font-bold text-emerald-400">
                  {team.wins}
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-bold text-base text-emerald-400">
                    {team.winrate}%
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-semibold text-cyan-400">
                    {team.top3} <span className="text-xs text-muted-foreground">({team.top3Rate}%)</span>
                  </span>
                </TableCell>

                <TableCell className="text-center font-bold text-amber-400">
                  {team.kills}
                </TableCell>

                <TableCell className="text-center font-semibold text-muted-foreground">
                  {team.avgKills}
                </TableCell>

                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={`font-bold ${team.performance.color} border-current/30 bg-current/5`}
                  >
                    {team.performance.label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
