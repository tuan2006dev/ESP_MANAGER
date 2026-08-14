"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ClipboardList,
  CheckCircle,
  Clock,
  MapPin,
  Key,
  Upload,
  Send,
  Eye,
  Trophy,
  Users,
  Wallet,
  Gift,
  AlertTriangle,
  LogOut,
  Bell,
  Coins,
} from "lucide-react";
import { updateTaskTeamStatus } from "@/actions/tasks";
import { submitMatchReport } from "@/actions/reports";
import { updateMemberProfile } from "@/actions/teams";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateWinrate,
  calculateTop3Rate,
  calculateAverageKills,
  getPerformanceLabel,
} from "@/lib/utils";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { TaskStatus } from "@prisma/client";

interface CaptainDashboardProps {
  team: any;
  user: any;
  notifications: any[];
}

export function CaptainDashboard({ team, user, notifications }: CaptainDashboardProps) {
  const currentMember = team.members.find((m: any) => m.userId === user.id) || team.members[0];

  const [openProfileEdit, setOpenProfileEdit] = useState(false);
  const [realName, setRealName] = useState(user.name || "");
  const [nickname, setNickname] = useState(currentMember?.nickname || "");
  const [gameUid, setGameUid] = useState(currentMember?.gameUid || "");
  const [profileLoading, setProfileLoading] = useState(false);

  const [reportModalTaskTeam, setReportModalTaskTeam] = useState<any | null>(
    null
  );
  const [reportRank, setReportRank] = useState<string>("1");
  const [reportKills, setReportKills] = useState<string>("0");
  const [reportPrizeMoney, setReportPrizeMoney] = useState<string>("0");
  const [reportResultType, setReportResultType] = useState<any>("WIN");
  const [reportScreenshot, setReportScreenshot] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [playerKillsMap, setPlayerKillsMap] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setReportScreenshot(compressed);
      toast.success("Đã tải và xử lý ảnh thành công!");
    } catch {
      toast.error("Không thể xử lý ảnh này");
    }
  };

  const handleMemberKillChange = (memberId: string, value: string) => {
    const newMap = { ...playerKillsMap, [memberId]: value };
    setPlayerKillsMap(newMap);
    
    // Auto-calculate sum of kills
    const total = Object.values(newMap).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    setReportKills(String(total));
  };

  // Performance calculations
  const matchResults = team.taskTeams
    .map((tt: any) => tt.matchResult)
    .filter(Boolean);

  const totalMatches = matchResults.length;
  const wins = matchResults.filter((r: any) => r.resultType === "WIN").length;
  const top3 = matchResults.filter((r: any) =>
    ["WIN", "TOP_2", "TOP_3"].includes(r.resultType)
  ).length;
  const totalKills = matchResults.reduce(
    (sum: number, r: any) => sum + r.totalKills,
    0
  );
  const winrate = calculateWinrate(wins, totalMatches);
  const top3Rate = calculateTop3Rate(top3, totalMatches);
  const avgKills = calculateAverageKills(totalKills, totalMatches);
  const performance = getPerformanceLabel(winrate);

  const handleAcceptTask = async (taskTeamId: string) => {
    try {
      await updateTaskTeamStatus(taskTeamId, TaskStatus.ACCEPTED);
      toast.success("Đã xác nhận nhận nhiệm vụ!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xác nhận");
    }
  };

  const handleStartTask = async (taskTeamId: string) => {
    try {
      await updateTaskTeamStatus(taskTeamId, TaskStatus.IN_PROGRESS);
      toast.success("Đã chuyển sang trạng thái đang thi đấu!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật");
    }
  };

  const openReportModal = (taskTeam: any) => {
    setReportModalTaskTeam(taskTeam);
    setReportRank(String(taskTeam.matchResult?.rank || "1"));
    setReportKills(String(taskTeam.matchResult?.totalKills || "0"));
    setReportPrizeMoney(String(taskTeam.matchResult?.prizeMoney || "0"));
    setReportResultType(taskTeam.matchResult?.resultType || "WIN");
    setReportScreenshot(taskTeam.matchResult?.screenshot || "");
    setReportNote(taskTeam.matchResult?.note || "");

    const initialKills: Record<string, string> = {};
    for (const m of team.members) {
      const existing = taskTeam.matchResult?.playerResults?.find(
        (pr: any) => pr.teamMemberId === m.id
      );
      initialKills[m.id] = existing ? String(existing.kills) : "0";
    }
    setPlayerKillsMap(initialKills);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalTaskTeam) return;

    setLoading(true);
    try {
      const playerResults = Object.entries(playerKillsMap).map(
        ([teamMemberId, kills]) => ({
          teamMemberId,
          kills: Number(kills) || 0,
        })
      );

      await submitMatchReport({
        taskTeamId: reportModalTaskTeam.id,
        rank: Number(reportRank) || 1,
        totalKills: Number(reportKills) || 0,
        prizeMoney: Number(reportPrizeMoney) || 0,
        resultType: reportResultType,
        screenshot: reportScreenshot,
        note: reportNote,
        playerResults,
      });

      toast.success("Đã gửi báo cáo kết quả thành công! Đang chờ BTC duyệt.");
      setReportModalTaskTeam(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi gửi báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-500 text-white">BTC Đã duyệt (APPROVED)</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-500 text-white">Đã gửi báo cáo (COMPLETED)</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-amber-500 text-white">Đang thi đấu (IN_PROGRESS)</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-cyan-500 text-white">Đã nhận nhiệm vụ (ACCEPTED)</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500 text-white">Báo cáo bị từ chối (REJECTED)</Badge>;
      case "MISSED":
        return <Badge className="bg-zinc-500 text-white">Không tham gia (MISSED)</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-400 border-amber-400">Chưa xác nhận (PENDING)</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="border-b border-border/40 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 min-h-16 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 glow-primary">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base gradient-text">
                ESP Manager
              </span>
              <span className="text-[11px] sm:text-xs text-muted-foreground ml-1.5 sm:ml-2 border-l border-border/40 pl-1.5 sm:pl-2">
                Đội Trưởng: <strong className="text-foreground">{team.name}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-2 sm:px-3 gap-1"
              onClick={() => setOpenProfileEdit(true)}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sửa thông tin / Tên game</span>
              <span className="sm:hidden">Sửa tên</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs h-8 px-2 sm:px-3"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl space-y-6 sm:space-y-8">
        {/* Team Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tổng Trận Đấu</p>
            <p className="text-2xl font-bold mt-1">{totalMatches}</p>
            <p className="text-[10px] text-muted-foreground">
              {team.taskTeams.length} nhiệm vụ
            </p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Chiến Thắng (Wins)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{wins}</p>
            <p className="text-[10px] text-muted-foreground">{top3} lần Top 3</p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tỷ lệ Thắng</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{winrate}%</p>
            <p className={`text-[10px] font-bold ${performance.color}`}>
              {performance.label}
            </p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">TOP 3 Rate</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{top3Rate}%</p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tổng Kills Đội</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{totalKills}</p>
            <p className="text-[10px] text-muted-foreground">{avgKills} kills/trận</p>
          </Card>
          <Card className="bg-card/80 border-border/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Thành viên</p>
            <p className="text-2xl font-bold mt-1">{team.members.length}</p>
            <p className="text-[10px] text-muted-foreground">Đang thi đấu</p>
          </Card>
        </div>

        {/* Notifications Alert */}
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <Card className="bg-primary/5 border-primary/20 p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold text-primary">
                  Thông báo mới từ BTC:
                </p>
                <p className="text-xs text-foreground mt-0.5">
                  {notifications.filter((n) => !n.isRead)[0].message}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="bg-card border border-border/40">
            <TabsTrigger value="tasks" className="gap-2">
              <ClipboardList className="h-4 w-4" /> Nhiệm vụ được giao ({team.taskTeams.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" /> Tuyển thủ của đội ({team.members.length})
            </TabsTrigger>
            <TabsTrigger value="finance" className="gap-2">
              <Wallet className="h-4 w-4" /> Lương & Thưởng đội
            </TabsTrigger>
            <TabsTrigger value="violations" className="gap-2">
              <AlertTriangle className="h-4 w-4" /> Vi phạm ({team.violations.length})
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-4">
              {team.taskTeams.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground bg-card/60">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Hiện tại đội chưa có nhiệm vụ nào được giao từ BTC.
                </Card>
              ) : (
                team.taskTeams.map((tt: any) => {
                  const task = tt.task;
                  const isApproved = tt.status === "APPROVED";

                  return (
                    <Card
                      key={tt.id}
                      className="border-border/40 bg-card/80 hover:border-primary/40 transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-foreground">
                                {task.name}
                              </h3>
                              <div>{getStatusBadge(tt.status)}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5 font-medium text-foreground">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {formatDate(task.date)} {task.time && `• ${task.time}`}
                              </span>
                              {task.map && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                                  Map: {task.map}
                                </span>
                              )}
                              {task.roomId && (
                                <span className="flex items-center gap-1.5 font-mono bg-accent/40 px-2 py-0.5 rounded text-foreground font-semibold">
                                  <Key className="h-3.5 w-3.5 text-primary" />
                                  Room: {task.roomId} | Pass: {task.roomPassword || "Không pass"}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <Coins className="h-3.5 w-3.5" />
                                Tiền đăng ký: {task.entryFee && task.entryFee > 0 ? `${task.entryFee.toLocaleString("vi-VN")} đ` : "0 đ (BTC Miễn phí)"}
                              </span>
                            </div>

                            {task.requirements && (
                              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 text-xs whitespace-pre-line text-muted-foreground">
                                <p className="font-semibold text-foreground mb-1">
                                  Yêu cầu từ BTC:
                                </p>
                                {task.requirements}
                              </div>
                            )}

                            {/* Match Result Display if submitted */}
                            {tt.matchResult && (
                              <div className="p-3 rounded-lg bg-accent/30 border border-border/40 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-foreground">
                                    Báo cáo kết quả của đội:
                                  </p>
                                  <Badge
                                    className={
                                      tt.matchResult.resultType === "WIN"
                                        ? "bg-emerald-500 text-white font-bold"
                                        : "bg-accent text-foreground"
                                    }
                                  >
                                    {tt.matchResult.resultType} (Hạng #{tt.matchResult.rank})
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Tổng Kills:{" "}
                                  <strong className="text-amber-400">
                                    {tt.matchResult.totalKills} Kills
                                  </strong>
                                </p>
                                {tt.matchResult.note && (
                                  <p className="text-xs text-muted-foreground italic">
                                    Ghi chú: {tt.matchResult.note}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0">
                            {tt.status === "PENDING" && (
                              <Button
                                size="sm"
                                className="bg-cyan-600 hover:bg-cyan-700 text-white glow-primary"
                                onClick={() => handleAcceptTask(tt.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1.5" /> Xác nhận nhận nhiệm vụ
                              </Button>
                            )}

                            {tt.status === "ACCEPTED" && (
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => handleStartTask(tt.id)}
                              >
                                Bắt đầu vào phòng đấu
                              </Button>
                            )}

                            {["ACCEPTED", "IN_PROGRESS", "REJECTED"].includes(
                              tt.status
                            ) && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white glow-primary"
                                onClick={() => openReportModal(tt)}
                              >
                                <Send className="h-4 w-4 mr-1.5" />
                                {tt.status === "REJECTED"
                                  ? "Gửi lại báo cáo"
                                  : "Báo cáo kết quả sau trận"}
                              </Button>
                            )}

                            {tt.status === "COMPLETED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => openReportModal(tt)}
                              >
                                Cập nhật lại báo cáo
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card className="border-border/40 bg-card/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tuyển thủ</TableHead>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Game UID</TableHead>
                    <TableHead>Vai trò</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.members.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-bold text-sm">
                        {m.nickname} ({m.user.name})
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {m.user.email}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {m.gameUid || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.user.role === "TEAM_CAPTAIN"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {m.user.role === "TEAM_CAPTAIN"
                            ? "Đội trưởng"
                            : "Thành viên"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 bg-card/60 border-border/40">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-400" /> Lịch sử Lương
                </h4>
                {team.salaries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có bảng lương.</p>
                ) : (
                  <div className="space-y-2">
                    {team.salaries.map((s: any) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-accent/20 text-xs"
                      >
                        <span className="font-semibold">Tháng {s.month}</span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(s.amount)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {s.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5 bg-card/60 border-border/40">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-400" /> Lịch sử Thưởng (Bonus)
                </h4>
                {team.bonuses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có khoản thưởng nào.</p>
                ) : (
                  <div className="space-y-2">
                    {team.bonuses.map((b: any) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-accent/20 text-xs"
                      >
                        <div>
                          <p className="font-semibold">{b.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {b.reason || b.month}
                          </p>
                        </div>
                        <span className="font-bold text-amber-400">
                          {formatCurrency(b.amount)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {b.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Violations Tab */}
          <TabsContent value="violations">
            <Card className="border-border/40 bg-card/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Mức độ</TableHead>
                    <TableHead>Nội dung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.violations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                        Đội không có vi phạm nào! 👏
                      </TableCell>
                    </TableRow>
                  ) : (
                    team.violations.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(v.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-rose-400 border-rose-500/30">
                            {v.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {v.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Submit Report Modal */}
      <Dialog
        open={!!reportModalTaskTeam}
        onOpenChange={(open) => !open && setReportModalTaskTeam(null)}
      >
        <DialogContent className="glass border-border/40 w-[94vw] max-w-[480px] max-h-[85vh] p-4 sm:p-6 overflow-y-auto rounded-2xl mx-auto shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm sm:text-base font-bold">
              Báo cáo Kết quả: {reportModalTaskTeam?.task.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitReport} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label htmlFor="rep-rank" className="text-xs">Thứ hạng (Rank)</Label>
                <Input
                  id="rep-rank"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 1"
                  value={reportRank}
                  onChange={(e) => setReportRank(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  className="font-bold text-sm h-9"
                />
              </div>
              <div>
                <Label htmlFor="rep-kills" className="text-xs">Tổng Kill</Label>
                <Input
                  id="rep-kills"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 15"
                  value={reportKills}
                  onChange={(e) => setReportKills(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  className="font-bold text-sm text-amber-400 h-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rep-res" className="text-xs">Kết quả chính thức</Label>
              <Select
                value={reportResultType}
                onValueChange={(val: any) => setReportResultType(val || "WIN")}
              >
                <SelectTrigger id="rep-res" className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIN">WIN (Hạng 1 / Top 1)</SelectItem>
                  <SelectItem value="TOP_2">TOP 2</SelectItem>
                  <SelectItem value="TOP_3">TOP 3</SelectItem>
                  <SelectItem value="TOP_5">TOP 5</SelectItem>
                  <SelectItem value="TOP_10">TOP 10</SelectItem>
                  <SelectItem value="OTHER">Khác (OTHER)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image upload section from device / phone */}
            <div className="space-y-1.5">
              <Label className="text-xs">Ảnh minh chứng (Chọn từ máy hoặc Dán link)</Label>
              
              {reportScreenshot ? (
                <div className="relative rounded-lg border border-border/50 overflow-hidden bg-card/60 p-2 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reportScreenshot}
                    alt="Preview bảng điểm"
                    className="w-full max-h-36 object-contain rounded mx-auto"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2 text-xs h-7"
                    onClick={() => setReportScreenshot("")}
                  >
                    Xóa và chọn ảnh khác
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-primary/40 hover:border-primary rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                    <Upload className="h-5 w-5 text-primary mb-1" />
                    <span className="text-xs font-semibold text-foreground text-center">
                      Bấm để chọn ảnh từ máy / điện thoại
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Tự động tối ưu dung lượng ảnh
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  <div className="relative flex items-center justify-center py-0.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40" />
                    </div>
                    <span className="relative bg-popover px-2 text-[10px] uppercase text-muted-foreground">
                      Hoặc dán URL
                    </span>
                  </div>

                  <Input
                    placeholder="https://i.imgur.com/... hoặc link ảnh"
                    value={reportScreenshot}
                    onChange={(e) => setReportScreenshot(e.target.value)}
                    className="text-xs h-7"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1.5 border-t border-border/30">
              <Label className="text-[11px] font-semibold text-muted-foreground">
                Thống kê Kill từng thành viên (Tự động cộng tổng):
              </Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {team.members.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs gap-2 px-2 py-1 rounded bg-accent/20"
                  >
                    <span className="font-semibold truncate max-w-[150px]">{m.nickname}:</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="w-16 h-6 text-center font-bold text-xs"
                      placeholder="0"
                      value={playerKillsMap[m.id] ?? "0"}
                      onChange={(e) =>
                        handleMemberKillChange(
                          m.id,
                          e.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="rep-note" className="text-xs">Ghi chú cho BTC</Label>
              <Textarea
                id="rep-note"
                rows={2}
                placeholder="Ghi chú về trận đấu nếu có..."
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                className="text-xs min-h-[50px]"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full glow-primary h-9 text-xs font-semibold">
              {loading ? "Đang gửi báo cáo..." : "Gửi Báo cáo cho BTC duyệt"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={openProfileEdit} onOpenChange={setOpenProfileEdit}>
        <DialogContent className="glass border-border/40 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Sửa thông tin & Tên game Đội trưởng
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setProfileLoading(true);
              try {
                await updateMemberProfile({
                  name: realName,
                  nickname,
                  gameUid,
                });
                toast.success("Đã cập nhật tên và thông tin game!");
                setOpenProfileEdit(false);
              } catch (err: any) {
                toast.error(err.message || "Lỗi cập nhật");
              } finally {
                setProfileLoading(false);
              }
            }}
            className="space-y-3 pt-2"
          >
            <div>
              <Label htmlFor="cap-real">Họ và tên thật</Label>
              <Input
                id="cap-real"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cap-nick">Tên trong game (Nickname / IGN)</Label>
              <Input
                id="cap-nick"
                placeholder="Ví dụ: EGO_Captain, ROX_Leader..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cap-uid">Game UID</Label>
              <Input
                id="cap-uid"
                placeholder="Ví dụ: 19847192"
                value={gameUid}
                onChange={(e) => setGameUid(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={profileLoading}
              className="w-full mt-3 glow-primary"
            >
              {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
