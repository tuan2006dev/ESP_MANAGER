"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Wallet,
  CheckCircle2,
  Settings,
  Calendar,
  AlertCircle,
  Users,
  DollarSign,
} from "lucide-react";
import {
  generateOrUpdateSalary,
  updateSalaryStatus,
  updateSalaryPolicy,
} from "@/actions/finance";
import { formatCurrency, getCurrentMonth, calculateWinrate } from "@/lib/utils";
import { toast } from "sonner";

interface SalaryManagerProps {
  policy: any;
  teams: any[];
  salaries: any[];
}

export function SalaryManager({ policy, teams, salaries }: SalaryManagerProps) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [openPolicy, setOpenPolicy] = useState(false);
  const [policyBase, setPolicyBase] = useState(policy?.baseSalary || 2000000);
  const [policyReq, setPolicyReq] = useState(
    policy?.requirements || "Hoàn thành các nhiệm vụ được giao trong tháng."
  );
  const [loading, setLoading] = useState(false);

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSalaryPolicy({
        name: "Chính sách lương tiêu chuẩn",
        baseSalary: Number(policyBase),
        requirements: policyReq,
      });
      toast.success("Đã cập nhật chính sách lương!");
      setOpenPolicy(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật chính sách");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateSalary = async (
    teamId: string,
    amount: number,
    status?: any
  ) => {
    try {
      await generateOrUpdateSalary({
        teamId,
        month: selectedMonth,
        amount,
        status,
      });
      toast.success("Đã cập nhật bảng lương đội!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật lương");
    }
  };

  const handleStatusChange = async (salaryId: string, status: any) => {
    try {
      await updateSalaryStatus(salaryId, status);
      toast.success(`Đã chuyển trạng thái sang ${status}!`);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật");
    }
  };

  const baseSalary = policy?.baseSalary || 2000000;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Quản lý Lương</h1>
          <p className="text-sm text-muted-foreground">
            Tính toán và chi trả lương đội tuyển dựa trên chính sách tổ chức
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="sel-m" className="text-xs text-muted-foreground">
              Tháng:
            </Label>
            <Input
              id="sel-m"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-[160px] h-9"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setOpenPolicy(true)}
          >
            <Settings className="h-4 w-4" /> Chính sách lương
          </Button>

          <Dialog open={openPolicy} onOpenChange={setOpenPolicy}>
            <DialogContent className="glass border-border/40 sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Cấu hình Chính sách Lương (Salary Policy)</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdatePolicy} className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="pol-base">Lương cơ bản / người / tháng (VND)</Label>
                  <Input
                    id="pol-base"
                    type="number"
                    min={100000}
                    value={policyBase}
                    onChange={(e) => setPolicyBase(Number(e.target.value))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ví dụ: 2.000.000 VNĐ / thành viên
                  </p>
                </div>
                <div>
                  <Label htmlFor="pol-req">Điều kiện nhận lương</Label>
                  <Textarea
                    id="pol-req"
                    rows={3}
                    value={policyReq}
                    onChange={(e) => setPolicyReq(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Đang lưu..." : "Lưu chính sách"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Policy Card Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase">
              Chính sách hiện tại:
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {formatCurrency(baseSalary)} / người / tháng
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Điều kiện: {policy?.requirements || "Hoàn thành nhiệm vụ được giao."}
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary self-start">
            Tự động nhân theo số thành viên
          </Badge>
        </CardContent>
      </Card>

      {/* Salary table by team */}
      <Card className="border-border/40 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Đội tuyển</TableHead>
              <TableHead className="text-center">Số Thành viên</TableHead>
              <TableHead className="text-center">Lương cơ bản / người</TableHead>
              <TableHead className="text-center">Số Nhiệm vụ hoàn thành</TableHead>
              <TableHead className="text-center">Tổng lương tháng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác duyệt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const existingSalary = salaries.find(
                (s) => s.teamId === team.id && s.month === selectedMonth
              );

              const memberCount = team.members.length;
              const defaultAmount = memberCount * baseSalary;
              const salaryAmount = existingSalary
                ? existingSalary.amount
                : defaultAmount;

              // Check tasks in this month
              const monthCompletedTasks = team.taskTeams.filter((tt: any) => {
                const taskDate = new Date(tt.task.date)
                  .toISOString()
                  .slice(0, 7);
                return (
                  taskDate === selectedMonth &&
                  (tt.status === "APPROVED" || tt.status === "COMPLETED")
                );
              }).length;

              const status = existingSalary?.status || "CHƯA_TẠO";

              return (
                <TableRow key={team.id}>
                  <TableCell className="font-bold text-sm">
                    {team.name}
                  </TableCell>

                  <TableCell className="text-center">
                    <span className="font-semibold">{memberCount}</span>{" "}
                    <span className="text-xs text-muted-foreground">người</span>
                  </TableCell>

                  <TableCell className="text-center text-xs text-muted-foreground">
                    {formatCurrency(baseSalary)}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        monthCompletedTasks > 0
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-amber-500/30 text-amber-400"
                      }
                    >
                      {monthCompletedTasks} nhiệm vụ
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center font-bold text-emerald-400">
                    {formatCurrency(salaryAmount)}
                  </TableCell>

                  <TableCell className="text-center">
                    {status === "PAID" ? (
                      <Badge className="bg-emerald-500 text-white">Đã thanh toán (PAID)</Badge>
                    ) : status === "APPROVED" ? (
                      <Badge className="bg-blue-500 text-white">Đã duyệt (APPROVED)</Badge>
                    ) : status === "REJECTED" ? (
                      <Badge className="bg-rose-500 text-white">Từ chối (REJECTED)</Badge>
                    ) : status === "PENDING" ? (
                      <Badge className="bg-amber-500 text-white">Chờ duyệt (PENDING)</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Chưa tạo bảng lương
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!existingSalary ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs glow-primary"
                          onClick={() =>
                            handleCreateOrUpdateSalary(team.id, defaultAmount, "PENDING")
                          }
                        >
                          Tạo bảng lương
                        </Button>
                      ) : (
                        <Select
                          value={existingSalary.status}
                          onValueChange={(val) =>
                            handleStatusChange(existingSalary.id, val)
                          }
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
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
