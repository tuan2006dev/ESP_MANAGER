"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Trash2,
  Trophy,
  Target,
  Crosshair,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  Edit,
} from "lucide-react";
import {
  createMemberAndAssign,
  removeTeamMember,
  setTeamCaptain,
  updateMemberProfile,
} from "@/actions/teams";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateWinrate,
  calculateTop3Rate,
  calculateAverageKills,
  getPerformanceLabel,
} from "@/lib/utils";
import { toast } from "sonner";

interface TeamProfileProps {
  team: any;
}

export function TeamProfileView({ team }: TeamProfileProps) {
  const [openAddMember, setOpenAddMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [gameUid, setGameUid] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Member Modal State
  const [editMember, setEditMember] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editGameUid, setEditGameUid] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const handleSetCaptain = async (memberId: string, memberNick: string) => {
    if (!confirm(`Bạn có chắc muốn chỉ định ${memberNick} làm Đội trưởng mới của đội?`)) return;
    try {
      await setTeamCaptain(team.id, memberId);
      toast.success(`Đã bổ nhiệm ${memberNick} làm Đội trưởng!`);
    } catch (err: any) {
      toast.error(err.message || "Lỗi bổ nhiệm đội trưởng");
    }
  };

  const openEditModal = (m: any) => {
    setEditMember(m);
    setEditName(m.user.name);
    setEditNickname(m.nickname);
    setEditGameUid(m.gameUid || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setEditLoading(true);
    try {
      await updateMemberProfile({
        memberId: editMember.id,
        name: editName,
        nickname: editNickname,
        gameUid: editGameUid,
      });
      toast.success("Đã cập nhật thông tin thành viên!");
      setEditMember(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật thông tin");
    } finally {
      setEditLoading(false);
    }
  };

  // Performance calculations
  const matchResults = team.taskTeams
    .map((tt: any) => tt.matchResult)
    .filter(Boolean);

  const totalTasks = team.taskTeams.length;
  const completedTasks = team.taskTeams.filter(
    (tt: any) => tt.status === "APPROVED"
  ).length;
  const totalMatches = matchResults.length;
  const wins = matchResults.filter((r: any) => r.resultType === "WIN").length;
  const top3 = matchResults.filter((r: any) =>
    ["WIN", "TOP_2", "TOP_3"].includes(r.resultType)
  ).length;
  const top5 = matchResults.filter((r: any) =>
    ["WIN", "TOP_2", "TOP_3", "TOP_5"].includes(r.resultType)
  ).length;
  const totalKills = matchResults.reduce(
    (sum: number, r: any) => sum + r.totalKills,
    0
  );
  const winrate = calculateWinrate(wins, totalMatches);
  const top3Rate = calculateTop3Rate(top3, totalMatches);
  const avgKills = calculateAverageKills(totalKills, totalMatches);
  const performance = getPerformanceLabel(winrate);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMemberAndAssign({
        teamId: team.id,
        name: memberName,
        email: memberEmail,
        nickname,
        gameUid,
        isCaptain,
      });
      toast.success("Đã thêm thành viên thành công!");
      setMemberName("");
      setMemberEmail("");
      setNickname("");
      setGameUid("");
      setIsCaptain(false);
      setOpenAddMember(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi thêm thành viên");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await removeTeamMember(memberId, team.id);
      toast.success("Đã xóa thành viên khỏi đội!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa thành viên");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/teams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-2xl glow-primary">
            {team.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <Badge
                variant="outline"
                className={
                  team.status === "ACTIVE"
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : "border-muted"
                }
              >
                {team.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <Calendar className="h-3 w-3" />
              Gia nhập: {formatDate(team.joinDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/80 border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">Tổng Nhiệm vụ</p>
          <p className="text-xl font-bold mt-1">{totalTasks}</p>
          <p className="text-[10px] text-muted-foreground">
            {completedTasks} hoàn thành
          </p>
        </Card>
        <Card className="bg-card/80 border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">Tổng Trận Đấu</p>
          <p className="text-xl font-bold mt-1">{totalMatches}</p>
          <p className="text-[10px] text-emerald-400 font-medium">
            {wins} Trận Thắng
          </p>
        </Card>
        <Card className="bg-card/80 border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">Tỷ Lệ Thắng (Winrate)</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{winrate}%</p>
          <p className={`text-[10px] font-bold ${performance.color}`}>
            {performance.label}
          </p>
        </Card>
        <Card className="bg-card/80 border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">TOP 3 Rate</p>
          <p className="text-xl font-bold text-cyan-400 mt-1">{top3Rate}%</p>
          <p className="text-[10px] text-muted-foreground">{top3} lần vào TOP 3</p>
        </Card>
        <Card className="bg-card/80 border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">Tổng Kills</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{totalKills}</p>
          <p className="text-[10px] text-muted-foreground">
            {avgKills} Kills / trận
          </p>
        </Card>
        <Card className="bg-card/80 border-border/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">Đánh giá Hiệu suất</p>
          <p className={`text-lg font-bold mt-1 ${performance.color}`}>
            {performance.label}
          </p>
          <p className="text-[10px] text-muted-foreground">Mục tiêu: 70-80%</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="bg-card border border-border/40">
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" /> Thành viên ({team.members.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <Target className="h-4 w-4" /> Lịch sử Nhiệm vụ ({team.taskTeams.length})
          </TabsTrigger>
          <TabsTrigger value="violations" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Vi phạm ({team.violations.length})
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="h-4 w-4" /> Tài chính & Lương thưởng
          </TabsTrigger>
        </TabsList>

        {/* Tab Members */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold">Danh sách tuyển thủ</h3>
            <Button size="sm" className="glow-primary" onClick={() => setOpenAddMember(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Thêm thành viên
            </Button>

            <Dialog open={openAddMember} onOpenChange={setOpenAddMember}>
              <DialogContent className="glass border-border/40 sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Thêm thành viên vào {team.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-3 pt-2">
                  <div>
                    <Label htmlFor="mem-name">Họ và tên</Label>
                    <Input
                      id="mem-name"
                      placeholder="Nguyễn Văn A"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mem-email">Tài khoản đăng nhập</Label>
                    <Input
                      id="mem-email"
                      placeholder="rox_a hoặc email..."
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mem-nick">Nickname trong game</Label>
                    <Input
                      id="mem-nick"
                      placeholder="ROX_Shadow"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mem-uid">Game UID (tùy chọn)</Label>
                    <Input
                      id="mem-uid"
                      placeholder="512984129"
                      value={gameUid}
                      onChange={(e) => setGameUid(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isCaptain"
                      checked={isCaptain}
                      onChange={(e) => setIsCaptain(e.target.checked)}
                      className="rounded border-border"
                    />
                    <Label htmlFor="isCaptain" className="cursor-pointer">
                      Chỉ định làm Đội trưởng (Team Captain)
                    </Label>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full mt-4">
                    {loading ? "Đang lưu..." : "Xác nhận thêm"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-border/40 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Tài khoản</TableHead>
                  <TableHead>Game UID</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày vào</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-bold text-sm">{m.nickname}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.user.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.user.email}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {m.gameUid || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.user.role === "TEAM_CAPTAIN" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {m.user.role === "TEAM_CAPTAIN"
                          ? "Đội trưởng"
                          : "Thành viên"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(m.joinDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {m.user.role !== "TEAM_CAPTAIN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1"
                            onClick={() => handleSetCaptain(m.id, m.nickname)}
                            title="Bổ nhiệm làm Đội trưởng"
                          >
                            <Crown className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Làm Đội trưởng</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => openEditModal(m)}
                          title="Sửa thông tin"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveMember(m.id)}
                          title="Xóa thành viên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Edit Member Modal */}
          <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
            <DialogContent className="glass border-border/40 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" /> Sửa thông tin tuyển thủ
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="ed-mem-name">Họ và tên thật</Label>
                  <Input
                    id="ed-mem-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ed-mem-nick">Nickname game (IGN)</Label>
                  <Input
                    id="ed-mem-nick"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    required
                    className="font-bold text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="ed-mem-uid">Game UID</Label>
                  <Input
                    id="ed-mem-uid"
                    value={editGameUid}
                    onChange={(e) => setEditGameUid(e.target.value)}
                    placeholder="UID..."
                    className="font-mono"
                  />
                </div>
                <Button type="submit" disabled={editLoading} className="w-full mt-3 glow-primary">
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab Tasks */}
        <TabsContent value="tasks" className="space-y-4">
          <Card className="border-border/40 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhiệm vụ</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Map</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Kills</TableHead>
                  <TableHead>Hạng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.taskTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      Chưa có nhiệm vụ nào được giao cho đội này.
                    </TableCell>
                  </TableRow>
                ) : (
                  team.taskTeams.map((tt: any) => (
                    <TableRow key={tt.id}>
                      <TableCell className="font-medium">
                        {tt.task.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(tt.task.date)} {tt.task.time && `• ${tt.task.time}`}
                      </TableCell>
                      <TableCell className="text-xs">{tt.task.map || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tt.status === "APPROVED"
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : tt.status === "REJECTED"
                              ? "border-red-500/30 text-red-400 bg-red-500/10"
                              : tt.status === "COMPLETED"
                              ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                              : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                          }
                        >
                          {tt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tt.matchResult ? (
                          <Badge
                            className={
                              tt.matchResult.resultType === "WIN"
                                ? "bg-emerald-500 text-white font-bold"
                                : "bg-accent text-foreground"
                            }
                          >
                            {tt.matchResult.resultType}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-amber-400">
                        {tt.matchResult ? tt.matchResult.totalKills : "—"}
                      </TableCell>
                      <TableCell className="font-bold">
                        {tt.matchResult ? `#${tt.matchResult.rank}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab Violations */}
        <TabsContent value="violations" className="space-y-4">
          <Card className="border-border/40 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Mô tả vi phạm</TableHead>
                  <TableHead>Thành viên (nếu có)</TableHead>
                  <TableHead>Minh chứng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.violations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Đội chưa có vi phạm nào. Tinh thần thi đấu rất tốt! 👏
                    </TableCell>
                  </TableRow>
                ) : (
                  team.violations.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(v.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            v.severity === "CRITICAL"
                              ? "border-red-500 text-red-500 bg-red-500/10"
                              : v.severity === "MAJOR"
                              ? "border-orange-500 text-orange-500 bg-orange-500/10"
                              : "border-amber-500 text-amber-500 bg-amber-500/10"
                          }
                        >
                          {v.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{v.description}</TableCell>
                      <TableCell className="text-xs">
                        {v.teamMember ? v.teamMember.nickname : "Cả đội"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.proof ? (
                          <a
                            href={v.proof}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            Xem ảnh
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab Finance */}
        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-card/60 border-border/40">
              <p className="text-xs text-muted-foreground">Tổng Doanh Thu Tạo Ra</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {formatCurrency(
                  team.revenues.reduce((s: number, r: any) => s + r.amount, 0)
                )}
              </p>
            </Card>
            <Card className="p-4 bg-card/60 border-border/40">
              <p className="text-xs text-muted-foreground">Tổng Lương Đã Thanh Toán</p>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {formatCurrency(
                  team.salaries
                    .filter((s: any) => s.status === "PAID")
                    .reduce((s: number, r: any) => s + r.amount, 0)
                )}
              </p>
            </Card>
            <Card className="p-4 bg-card/60 border-border/40">
              <p className="text-xs text-muted-foreground">Tổng Thưởng</p>
              <p className="text-xl font-bold text-amber-400 mt-1">
                {formatCurrency(
                  team.bonuses.reduce((s: number, r: any) => s + r.amount, 0)
                )}
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
