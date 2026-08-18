"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreVertical, Eye, Trash2, Edit, ShieldAlert } from "lucide-react";
import { createTeam, deleteTeam, updateTeam } from "@/actions/teams";
import { banTeamIps } from "@/actions/ip-bans";
import { toast } from "sonner";
import { calculateWinrate } from "@/lib/utils";

interface TeamWithDetails {
  id: string;
  name: string;
  logo: string | null;
  status: string;
  joinDate: Date;
  members: {
    id: string;
    nickname: string;
    user: { name: string; role: string; email: string };
  }[];
  taskTeams: {
    status: string;
    matchResult: {
      resultType: string;
      totalKills: number;
      rank: number;
    } | null;
  }[];
}

export function TeamsList({ teams }: { teams: TeamWithDetails[] }) {
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTeam({ name, logo });
      toast.success(`Đã tạo đội ${name} thành công!`);
      setName("");
      setLogo("");
      setOpenCreate(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Lỗi tạo đội");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, teamName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đội ${teamName}?`)) return;
    try {
      await deleteTeam(id);
      toast.success(`Đã xóa đội ${teamName}`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Lỗi xóa đội");
    }
  };

  const handleBanTeamIps = async (teamId: string, teamName: string) => {
    if (confirm(`Bạn có chắc chắn muốn cấm toàn bộ IP của các thành viên trong đội ${teamName}? Các thành viên sẽ không thể truy cập hệ thống.`)) {
      try {
        const res = await banTeamIps(teamId, `Cấm đội ${teamName}`);
        if (res.error) throw new Error(res.error);
        toast.success(`Đã cấm tất cả IP của đội ${teamName}`);
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Quản lý Đội tuyển</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách các đội tuyển trực thuộc tổ chức
          </p>
        </div>

        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
          onClick={() => setOpenCreate(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm Đội mới
        </Button>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="glass border-border/40 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Thêm Đội tuyển mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="team-name">Tên đội tuyển</Label>
                <Input
                  id="team-name"
                  placeholder="Ví dụ: ROX ESP, EGO ESP..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-logo">Logo URL (tùy chọn)</Label>
                <Input
                  id="team-logo"
                  placeholder="https://..."
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang tạo..." : "Xác nhận tạo đội"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const results = team.taskTeams
            .map((tt) => tt.matchResult)
            .filter(Boolean);
          const totalMatches = results.length;
          const wins = results.filter((r) => r!.resultType === "WIN").length;
          const winrate = calculateWinrate(wins, totalMatches);
          const totalKills = results.reduce(
            (sum, r) => sum + (r?.totalKills || 0),
            0
          );
          const captain = team.members.find(
            (m) => m.user.role === "TEAM_CAPTAIN"
          );

          return (
            <Card
              key={team.id}
              className="bg-card/80 border-border/40 hover:border-primary/40 stat-card transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg glow-primary">
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{team.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Đội trưởng:{" "}
                        <span className="text-foreground font-medium">
                          {captain ? captain.nickname : "Chưa chỉ định"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link href={`/admin/teams/${team.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                      onClick={() => handleBanTeamIps(team.id, team.name)}
                      title="Cấm IP của đội"
                    >
                      <ShieldAlert className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(team.id, team.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 rounded-lg bg-accent/20 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">TV</p>
                    <p className="font-bold text-sm">{team.members.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trận</p>
                    <p className="font-bold text-sm">{totalMatches}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Win%</p>
                    <p className="font-bold text-sm text-emerald-400">
                      {winrate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kills</p>
                    <p className="font-bold text-sm text-amber-400">
                      {totalKills}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <Badge
                    variant="outline"
                    className={
                      team.status === "ACTIVE"
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : "border-muted text-muted-foreground"
                    }
                  >
                    {team.status === "ACTIVE" ? "Đang hoạt động" : team.status}
                  </Badge>

                  <Link href={`/admin/teams/${team.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Quản lý đội
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
