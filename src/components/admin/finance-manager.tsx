"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Receipt,
  PiggyBank,
  Wallet,
  Gift,
  Coins,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { createRevenue, deleteRevenue, createExpense, deleteExpense } from "@/actions/finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface FinanceManagerProps {
  revenues: any[];
  expenses: any[];
  salaries: any[];
  bonuses: any[];
  teams: { id: string; name: string }[];
  matchTeams?: any[];
  summary: {
    totalRevenue: number;
    totalSalary: number;
    totalBonus: number;
    totalExpense: number;
    profit: number;
    totalMatchFeeSpent?: number;
    totalMatchPrizeWon?: number;
  };
}

export function FinanceManager({
  revenues,
  expenses,
  salaries,
  bonuses,
  teams,
  matchTeams = [],
  summary,
}: FinanceManagerProps) {
  const [openRev, setOpenRev] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const [revTeamId, setRevTeamId] = useState(teams[0]?.id || "");
  const [revAmount, setRevAmount] = useState("");
  const [revSource, setRevSource] = useState("Custom");
  const [revDate, setRevDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [revNote, setRevNote] = useState("");

  const [expTeamId, setExpTeamId] = useState("none");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("Vận hành");
  const [expDate, setExpDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expNote, setExpNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createRevenue({
        teamId: revTeamId,
        amount: Number(revAmount),
        source: revSource,
        date: revDate,
        note: revNote,
      });
      toast.success("Đã ghi nhận doanh thu thành công!");
      setRevAmount("");
      setRevNote("");
      setOpenRev(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi thêm doanh thu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createExpense({
        teamId: expTeamId === "none" ? undefined : expTeamId,
        amount: Number(expAmount),
        category: expCategory,
        date: expDate,
        note: expNote,
      });
      toast.success("Đã ghi nhận chi phí thành công!");
      setExpAmount("");
      setExpNote("");
      setOpenExp(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi thêm chi phí");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm("Xóa bản ghi doanh thu này?")) return;
    try {
      await deleteRevenue(id);
      toast.success("Đã xóa doanh thu!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Xóa bản ghi chi phí này?")) return;
    try {
      await deleteExpense(id);
      toast.success("Đã xóa chi phí!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Quản lý Tài chính Nội bộ
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi Doanh thu, Lương, Thưởng, Chi phí và Lợi nhuận của tổ chức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setOpenRev(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nhập Doanh thu
          </Button>

          <Dialog open={openRev} onOpenChange={setOpenRev}>
            <DialogContent className="glass border-border/40 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ghi nhận Doanh thu Đội tạo ra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRevenue} className="space-y-3 pt-2">
                <div>
                  <Label>Đội tuyển tạo doanh thu</Label>
                  <Select value={revTeamId} onValueChange={(val: any) => setRevTeamId(val || "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Số tiền (VND)</Label>
                  <Input
                    type="number"
                    min={1000}
                    placeholder="Ví dụ: 8000000"
                    value={revAmount}
                    onChange={(e) => setRevAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Nguồn doanh thu</Label>
                  <Select value={revSource} onValueChange={(val: any) => setRevSource(val || "Custom")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Custom">Custom</SelectItem>
                      <SelectItem value="Tournament">Tournament</SelectItem>
                      <SelectItem value="Sponsorship">Tài trợ / Sponsor</SelectItem>
                      <SelectItem value="Other">Khác (Other)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ngày ghi nhận</Label>
                  <Input
                    type="date"
                    value={revDate}
                    onChange={(e) => setRevDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <Input
                    placeholder="Thông tin thêm..."
                    value={revNote}
                    onChange={(e) => setRevNote(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full mt-3">
                  {loading ? "Đang lưu..." : "Xác nhận ghi nhận"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="border-red-500/40 text-red-400 hover:bg-red-500/10"
            onClick={() => setOpenExp(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nhập Chi phí
          </Button>

          <Dialog open={openExp} onOpenChange={setOpenExp}>
            <DialogContent className="glass border-border/40 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ghi nhận Chi phí Tổ chức</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-3 pt-2">
                <div>
                  <Label>Liên quan đến Đội (tùy chọn)</Label>
                  <Select value={expTeamId} onValueChange={(val: any) => setExpTeamId(val || "none")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Chi phí chung tổ chức</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          Đội {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Số tiền (VND)</Label>
                  <Input
                    type="number"
                    min={1000}
                    placeholder="Ví dụ: 1500000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Danh mục chi phí</Label>
                  <Input
                    placeholder="Ví dụ: Phí phòng custom, thuê máy, thiết bị..."
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Ngày chi</Label>
                  <Input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <Input
                    placeholder="Ghi chú chi tiết..."
                    value={expNote}
                    onChange={(e) => setExpNote(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full mt-3">
                  {loading ? "Đang lưu..." : "Xác nhận chi phí"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-card/60 border-border/40">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Tổng Doanh Thu</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </Card>

        <Card className="p-4 bg-card/60 border-border/40">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Tổng Lương</span>
            <Wallet className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {formatCurrency(summary.totalSalary)}
          </p>
        </Card>

        <Card className="p-4 bg-card/60 border-border/40">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Tổng Thưởng</span>
            <Gift className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {formatCurrency(summary.totalBonus)}
          </p>
        </Card>

        <Card className="p-4 bg-card/60 border-border/40">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Tổng Chi Phí</span>
            <Receipt className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400">
            {formatCurrency(summary.totalExpense)}
          </p>
        </Card>

        <Card className="p-4 bg-card/60 border-border/40">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase">Lợi Nhuận (Profit)</span>
            <PiggyBank className="h-4 w-4 text-primary" />
          </div>
          <p
            className={`text-2xl font-bold ${
              summary.profit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(summary.profit)}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="bg-card border border-border/40">
          <TabsTrigger value="matches" className="gap-2">
            <Gamepad2 className="h-4 w-4 text-primary" /> Lãi/Lỗ Trận & Cus ({matchTeams.length})
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" /> Doanh thu ({revenues.length})
          </TabsTrigger>
          <TabsTrigger value="expense" className="gap-2">
            <Receipt className="h-4 w-4" /> Chi phí ({expenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Match & Cus PnL */}
        <TabsContent value="matches">
          <Card className="border-border/40 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Nhiệm vụ / Trận đấu</TableHead>
                  <TableHead>Đội tuyển</TableHead>
                  <TableHead>Thành tích</TableHead>
                  <TableHead>Tiền Cus bỏ ra (Vốn)</TableHead>
                  <TableHead>Tiền Thưởng thu về</TableHead>
                  <TableHead className="text-right">Lãi / Lỗ trận này</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Chưa có trận đấu nào được duyệt kết quả.
                    </TableCell>
                  </TableRow>
                ) : (
                  matchTeams.map((mt: any) => {
                    const entryFee = mt.task.entryFee || 0;
                    const prize = mt.matchResult?.prizeMoney || 0;
                    const pnl = prize - entryFee;

                    return (
                      <TableRow key={mt.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(mt.task.date)}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {mt.task.name}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-sm">{mt.team.name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-xs text-cyan-400">
                            {mt.matchResult?.resultType} (Hạng #{mt.matchResult?.rank} • {mt.matchResult?.totalKills} Kills)
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-rose-400">
                          {entryFee > 0 ? (
                            <span className="flex items-center gap-1">
                              <Coins className="h-3.5 w-3.5" />
                              {formatCurrency(entryFee)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">0 đ (Miễn phí)</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-emerald-400">
                          {formatCurrency(prize)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pnl > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <TrendingUp className="h-3.5 w-3.5" /> +{formatCurrency(pnl)} (LÃI)
                            </span>
                          ) : pnl === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/15 text-zinc-300 border border-zinc-500/30">
                              0 đ (HÒA VỐN)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <TrendingDown className="h-3.5 w-3.5" /> {formatCurrency(pnl)} (LỖ)
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="border-border/40 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Đội tuyển</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Chưa có bản ghi doanh thu nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  revenues.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell className="font-bold">{r.team.name}</TableCell>
                      <TableCell>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-semibold">
                          {r.source}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-400">
                        {formatCurrency(r.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.note || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteRevenue(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="expense">
          <Card className="border-border/40 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Đội tuyển (nếu có)</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Chưa có bản ghi chi phí nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(e.date)}
                      </TableCell>
                      <TableCell className="font-bold">{e.category}</TableCell>
                      <TableCell className="text-xs">
                        {e.team ? e.team.name : "Tổ chức chung"}
                      </TableCell>
                      <TableCell className="font-bold text-rose-400">
                        {formatCurrency(e.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {e.note || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteExpense(e.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
