"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Gift, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { createBonus, updateBonusStatus, deleteBonus } from "@/actions/finance";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";
import { toast } from "sonner";

interface BonusManagerProps {
  bonuses: any[];
  teams: any[];
}

export function BonusManager({ bonuses, teams }: BonusManagerProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(getCurrentMonth());
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBonus({
        name,
        reason,
        amount: Number(amount),
        month,
        teamId,
      });
      toast.success("Đã trao thưởng thành công!");
      setName("");
      setReason("");
      setAmount("");
      setOpenCreate(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo thưởng");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bonusId: string, status: any) => {
    try {
      await updateBonusStatus(bonusId, status);
      toast.success(`Đã đổi trạng thái thưởng sang ${status}!`);
    } catch (err: any) {
      toast.error(err.message || "Lỗi đổi trạng thái");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa khoản thưởng này?")) return;
    try {
      await deleteBonus(id);
      toast.success("Đã xóa khoản thưởng!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Quản lý Khen thưởng (Bonus)</h1>
          <p className="text-sm text-muted-foreground">
            Tạo và theo dõi các khoản thưởng thành tích cho đội tuyển và thành viên
          </p>
        </div>

        <Button className="glow-primary" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Tạo khoản thưởng mới
        </Button>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="glass border-border/40 sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Tạo khoản thưởng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div>
                <Label htmlFor="b-team">Đội tuyển nhận thưởng</Label>
                <Select value={teamId} onValueChange={(val: any) => setTeamId(val || "")}>
                  <SelectTrigger id="b-team" className="w-full">
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
                <Label htmlFor="b-name">Tên khoản thưởng</Label>
                <Input
                  id="b-name"
                  placeholder="Ví dụ: Thưởng vô địch Custom / Thưởng MVP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="b-amount">Số tiền thưởng (VND)</Label>
                <Input
                  id="b-amount"
                  type="number"
                  min={10000}
                  placeholder="Ví dụ: 1000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="b-month">Tháng áp dụng</Label>
                <Input
                  id="b-month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="b-reason">Lý do / Thành tích đạt được</Label>
                <Input
                  id="b-reason"
                  placeholder="Ví dụ: Đạt winrate 80% trong tháng"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-3">
                {loading ? "Đang tạo..." : "Xác nhận tạo thưởng"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/40 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên thưởng</TableHead>
              <TableHead>Đội tuyển</TableHead>
              <TableHead>Tháng</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bonuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <Gift className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Chưa có khoản thưởng nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              bonuses.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-bold text-sm">
                    {b.name}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {b.team.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {b.month}
                  </TableCell>
                  <TableCell className="font-bold text-amber-400">
                    {formatCurrency(b.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {b.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={b.status}
                      onValueChange={(val) => handleStatusChange(b.id, val)}
                    >
                      <SelectTrigger className="h-7 text-xs w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">PENDING</SelectItem>
                        <SelectItem value="APPROVED">APPROVED</SelectItem>
                        <SelectItem value="PAID">PAID</SelectItem>
                        <SelectItem value="REJECTED">REJECTED</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(b.id)}
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
    </div>
  );
}
