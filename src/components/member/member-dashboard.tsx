"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Clock,
  MapPin,
  Key,
  Crosshair,
  Trophy,
  Calendar,
  LogOut,
  Bell,
  Edit,
  ArrowRight,
  User,
  Coins,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { updateMemberProfile } from "@/actions/teams";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface MemberDashboardProps {
  member: any;
  user: any;
  notifications: any[];
}

export function MemberDashboard({ member, user, notifications }: MemberDashboardProps) {
  const team = member.team;

  const [openEdit, setOpenEdit] = useState(false);
  const [realName, setRealName] = useState(user.name || "");
  const [nickname, setNickname] = useState(member.nickname || "");
  const [gameUid, setGameUid] = useState(member.gameUid || "");
  const [loading, setLoading] = useState(false);

  const playerResults = member.playerResults || [];
  const totalKills = playerResults.reduce(
    (sum: number, r: any) => sum + r.kills,
    0
  );
  const bestPerformance = playerResults.reduce(
    (max: number, r: any) => Math.max(max, r.kills),
    0
  );

  const isCaptain = user.role === "TEAM_CAPTAIN" || user.role === "ADMIN";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMemberProfile({
        name: realName,
        nickname,
        gameUid,
      });
      toast.success("Đã cập nhật tên và thông tin game thành công!");
      setOpenEdit(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-primary">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-base gradient-text">ESP Manager</span>
              <span className="text-xs text-muted-foreground ml-2 border-l border-border/40 pl-2">
                Tuyển thủ: <strong className="text-foreground">{member.nickname}</strong> ({team.name})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCaptain && (
              <Link href="/captain">
                <Button size="sm" className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 text-xs h-8">
                  Vào Cổng Đội Trưởng <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1"
              onClick={() => setOpenEdit(true)}
            >
              <Edit className="h-3.5 w-3.5" /> Sửa thông tin / Tên game
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs h-8"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" /> Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Banner if Captain */}
        {isCaptain && (
          <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-primary/30 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-base text-foreground flex items-center gap-2">
                  👑 Bạn là Đội Trưởng của {team.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đội trưởng có quyền Nhận nhiệm vụ, Báo cáo kết quả trận đấu, gửi ảnh minh chứng và xem lương/thưởng đội.
                </p>
              </div>
              <Link href="/captain" className="shrink-0">
                <Button className="glow-primary text-xs h-8 font-semibold">
                  Mở Cổng Quản Lý Đội Trưởng <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Personal Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Đội tuyển</p>
            <p className="text-lg font-bold text-primary mt-1">{team.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {member.user.role === "TEAM_CAPTAIN" ? "Đội trưởng" : "Thành viên"}
            </p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tổng Kills Cá Nhân</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{totalKills}</p>
            <p className="text-[10px] text-muted-foreground">{playerResults.length} trận đã đấu</p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Best Kill / Trận</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{bestPerformance} Kills</p>
            <p className="text-[10px] text-muted-foreground">Kỷ lục cao nhất</p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Game UID</p>
            <p className="text-lg font-bold font-mono mt-1 text-foreground">
              {member.gameUid || "Chưa cập nhật"}
            </p>
            <Button
              variant="link"
              className="text-[10px] h-4 p-0 text-primary"
              onClick={() => setOpenEdit(true)}
            >
              Đổi UID
            </Button>
          </Card>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Bell className="h-4 w-4" /> Thông báo từ Ban Tổ Chức:
            </div>
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className="text-xs text-foreground p-2.5 rounded bg-card/60 border border-border/30">
                <span className="font-semibold text-primary">{n.title}:</span> {n.message}
              </div>
            ))}
          </Card>
        )}

        {/* Assigned Team Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Lịch thi đấu & Nhiệm vụ của đội
          </h2>

          <div className="space-y-3">
            {team.taskTeams.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground bg-card/60">
                Đội hiện chưa có lịch thi đấu nào.
              </Card>
            ) : (
              team.taskTeams.map((tt: any) => {
                const task = tt.task;
                return (
                  <Card key={tt.id} className="p-5 border-border/40 bg-card/80 hover:border-primary/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">{task.name}</h3>
                          <Badge
                            variant="outline"
                            className={
                              tt.status === "APPROVED"
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : tt.status === "COMPLETED"
                                ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                                : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            }
                          >
                            {tt.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {formatDate(task.date)} {task.time && `• ${task.time}`}
                          </span>
                          {task.map && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-amber-400" />
                              Map: {task.map}
                            </span>
                          )}
                          {task.roomId && (
                            <span className="font-mono bg-accent/40 px-2 py-0.5 rounded font-semibold text-foreground">
                              Room: {task.roomId} | Pass: {task.roomPassword || "Không pass"}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Coins className="h-3.5 w-3.5" />
                            Tiền đăng ký: {task.entryFee && task.entryFee > 0 ? `${task.entryFee.toLocaleString("vi-VN")} đ` : "0 đ (BTC Miễn phí)"}
                          </span>
                        </div>
                      </div>

                      {tt.matchResult && (
                        <Badge className="bg-emerald-500 text-white font-bold self-start">
                          {tt.matchResult.resultType} (Hạng #{tt.matchResult.rank} • {tt.matchResult.totalKills} Kills)
                        </Badge>
                      )}
                    </div>

                    {task.requirements && (
                      <div className="mt-3 p-2.5 rounded bg-accent/20 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Yêu cầu từ BTC: </span>
                        {task.requirements}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="glass border-border/40 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Sửa thông tin & Tên game
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2">
            <div>
              <Label htmlFor="u-real">Họ và tên thật</Label>
              <Input
                id="u-real"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="u-nick">Tên trong game (Nickname / IGN)</Label>
              <Input
                id="u-nick"
                placeholder="Ví dụ: EGO_Shadow, ROX_Viper..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="u-uid">Game UID</Label>
              <Input
                id="u-uid"
                placeholder="Ví dụ: 512984129"
                value={gameUid}
                onChange={(e) => setGameUid(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-3 glow-primary">
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
