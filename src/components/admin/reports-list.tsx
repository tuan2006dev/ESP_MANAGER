"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  FileText,
  DollarSign,
  Coins,
} from "lucide-react";
import {
  approveMatchReport,
  rejectMatchReport,
  editMatchReport,
} from "@/actions/reports";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ReportsListProps {
  reports: any[];
}

export function ReportsList({ reports }: ReportsListProps) {
  // Approve Dialog states
  const [approveDialog, setApproveDialog] = useState<any | null>(null);
  const [approvePrizeMoney, setApprovePrizeMoney] = useState("0");
  const [approveNote, setApproveNote] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);

  // Reject Dialog states
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Edit Dialog states
  const [editDialog, setEditDialog] = useState<any | null>(null);
  const [editRank, setEditRank] = useState("1");
  const [editKills, setEditKills] = useState("0");
  const [editPrizeMoney, setEditPrizeMoney] = useState("0");
  const [editResultType, setEditResultType] = useState("WIN");
  const [editNote, setEditNote] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // View Screenshot
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null);

  const openApproveModal = (report: any) => {
    setApproveDialog(report);
    setApprovePrizeMoney(String(report.prizeMoney || "0"));
    setApproveNote("");
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveDialog) return;
    setApproveLoading(true);
    try {
      await approveMatchReport(approveDialog.id, {
        prizeMoney: Number(approvePrizeMoney) || 0,
        note: approveNote,
      });
      toast.success("Đã duyệt kết quả và ghi nhận tiền thưởng thành công!");
      setApproveDialog(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi duyệt kết quả");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setRejectLoading(true);
    try {
      await rejectMatchReport(rejectDialog, rejectReason);
      toast.success("Đã từ chối báo cáo!");
      setRejectDialog(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi từ chối báo cáo");
    } finally {
      setRejectLoading(false);
    }
  };

  const openEdit = (rep: any) => {
    setEditDialog(rep);
    setEditRank(String(rep.rank));
    setEditKills(String(rep.totalKills));
    setEditPrizeMoney(String(rep.prizeMoney || "0"));
    setEditResultType(rep.resultType);
    setEditNote(rep.note || "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog) return;
    setEditLoading(true);
    try {
      await editMatchReport(editDialog.id, {
        rank: Number(editRank) || 1,
        totalKills: Number(editKills) || 0,
        prizeMoney: Number(editPrizeMoney) || 0,
        resultType: editResultType as any,
        note: editNote,
      });
      toast.success("Đã cập nhật kết quả trận đấu!");
      setEditDialog(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật kết quả");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Duyệt Báo cáo Kết quả Trận đấu</h1>
        <p className="text-sm text-muted-foreground">
          Xem xét, ghi nhận Tiền giải thưởng và phê duyệt báo cáo do các Đội trưởng gửi về
        </p>
      </div>

      <Card className="border-border/40 bg-card/60 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Đội tuyển</TableHead>
              <TableHead>Nhiệm vụ / Custom</TableHead>
              <TableHead>Kết quả</TableHead>
              <TableHead>Hạng</TableHead>
              <TableHead>Kills</TableHead>
              <TableHead>Tiền thưởng giải</TableHead>
              <TableHead>Minh chứng</TableHead>
              <TableHead>Chi tiết Tuyển thủ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Chưa có báo cáo kết quả nào được gửi về.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const isApproved = !!report.approvedAt;
                const isRejected = report.taskTeam.status === "REJECTED";

                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-bold text-sm">
                      {report.taskTeam.team.name}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">
                          {report.taskTeam.task.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(report.taskTeam.task.date)} • Map:{" "}
                          {report.taskTeam.task.map || "Mặc định"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          report.resultType === "WIN"
                            ? "bg-emerald-500 text-white font-bold"
                            : ["TOP_2", "TOP_3"].includes(report.resultType)
                            ? "bg-cyan-500 text-white font-bold"
                            : "bg-accent text-foreground"
                        }
                      >
                        {report.resultType}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-bold">#{report.rank}</TableCell>

                    <TableCell className="font-bold text-amber-400">
                      {report.totalKills} Kills
                    </TableCell>

                    <TableCell className="font-bold text-emerald-400 font-mono text-xs">
                      {report.prizeMoney && report.prizeMoney > 0
                        ? `${report.prizeMoney.toLocaleString("vi-VN")} đ`
                        : "0 đ"}
                    </TableCell>

                    <TableCell>
                      {report.screenshot ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1 text-primary"
                          onClick={() => setViewScreenshot(report.screenshot)}
                        >
                          <Eye className="h-3 w-3" /> Xem ảnh
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Không có ảnh
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {report.playerResults && report.playerResults.length > 0 ? (
                        <div className="space-y-0.5 text-xs">
                          {report.playerResults.map((pr: any) => (
                            <span
                              key={pr.id}
                              className="inline-block bg-accent/40 px-1.5 py-0.5 rounded mr-1 mb-1 font-mono text-[11px]"
                            >
                              {pr.teamMember.nickname}: {pr.kills}k
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Chỉ có Total Kills
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isApproved ? (
                        <div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Đã duyệt
                          </Badge>
                          {report.approvedBy && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Bởi {report.approvedBy.name}
                            </p>
                          )}
                        </div>
                      ) : isRejected ? (
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                          Bị từ chối
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Chờ BTC duyệt
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isApproved && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                              onClick={() => openApproveModal(report)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                              onClick={() => setRejectDialog(report.id)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Từ chối
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openEdit(report)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Admin Approve & Record Prize Money Modal */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent className="glass border-border/40 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <Coins className="h-5 w-5" /> Duyệt Kết quả & Ghi nhận Tiền thưởng
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmApprove} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-accent/30 space-y-1 text-xs">
              <p>
                <strong className="text-foreground">Đội tuyển:</strong>{" "}
                {approveDialog?.taskTeam.team.name}
              </p>
              <p>
                <strong className="text-foreground">Nhiệm vụ:</strong>{" "}
                {approveDialog?.taskTeam.task.name}
              </p>
              <p>
                <strong className="text-foreground">Thành tích báo cáo:</strong>{" "}
                <span className="font-bold text-amber-400">
                  {approveDialog?.resultType} (Hạng #{approveDialog?.rank} • {approveDialog?.totalKills} Kills)
                </span>
              </p>
            </div>

            <div>
              <Label htmlFor="app-prize" className="text-sm font-semibold">
                Tiền giải thưởng cho đội (VNĐ)
              </Label>
              <Input
                id="app-prize"
                type="text"
                inputMode="numeric"
                placeholder="Ví dụ: 20000, 50000, 500000..."
                value={approvePrizeMoney}
                onChange={(e) => setApprovePrizeMoney(e.target.value.replace(/[^0-9]/g, ""))}
                className="font-bold text-lg text-emerald-400 mt-1"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Admin nhập số tiền thưởng thực tế đội đạt được. Số tiền này sẽ tự động ghi vào Doanh thu của Đội.
              </p>
            </div>

            <div>
              <Label htmlFor="app-note">Ghi chú của BTC (Tùy chọn)</Label>
              <Textarea
                id="app-note"
                rows={2}
                placeholder="Lời khen, lý do thưởng hoặc ghi chú..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={approveLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {approveLoading ? "Đang xử lý..." : "Xác nhận Duyệt & Ghi nhận Thưởng"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent className="glass border-border/40 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Từ chối báo cáo kết quả
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="rej-reason">Lý do từ chối (Bắt buộc)</Label>
              <Textarea
                id="rej-reason"
                rows={3}
                placeholder="Ví dụ: Ảnh mờ không rõ tên tuyển thủ, sai số Kill, v.v..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <Button
              variant="destructive"
              disabled={rejectLoading || !rejectReason.trim()}
              className="w-full"
              onClick={handleReject}
            >
              {rejectLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="glass border-border/40 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Chỉnh sửa kết quả trận
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ed-rank">Thứ hạng (Rank)</Label>
                <Input
                  id="ed-rank"
                  type="text"
                  inputMode="numeric"
                  value={editRank}
                  onChange={(e) => setEditRank(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  className="font-bold"
                />
              </div>
              <div>
                <Label htmlFor="ed-kills">Tổng Kills</Label>
                <Input
                  id="ed-kills"
                  type="text"
                  inputMode="numeric"
                  value={editKills}
                  onChange={(e) => setEditKills(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                  className="font-bold text-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ed-res">Kết quả</Label>
                <Select
                  value={editResultType}
                  onValueChange={(val: any) => setEditResultType(val || "WIN")}
                >
                  <SelectTrigger id="ed-res">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIN">WIN (Top 1)</SelectItem>
                    <SelectItem value="TOP_2">TOP 2</SelectItem>
                    <SelectItem value="TOP_3">TOP 3</SelectItem>
                    <SelectItem value="TOP_5">TOP 5</SelectItem>
                    <SelectItem value="TOP_10">TOP 10</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ed-prize">Thưởng giải (VNĐ)</Label>
                <Input
                  id="ed-prize"
                  type="text"
                  inputMode="numeric"
                  value={editPrizeMoney}
                  onChange={(e) => setEditPrizeMoney(e.target.value.replace(/[^0-9]/g, ""))}
                  className="font-bold text-emerald-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ed-note">Ghi chú</Label>
              <Textarea
                id="ed-note"
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={editLoading} className="w-full mt-3 glow-primary">
              {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Screenshot Preview Modal */}
      <Dialog open={!!viewScreenshot} onOpenChange={(open) => !open && setViewScreenshot(null)}>
        <DialogContent className="glass border-border/40 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ảnh minh chứng kết quả trận</DialogTitle>
          </DialogHeader>
          <div className="p-2 flex justify-center max-h-[80vh] overflow-y-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewScreenshot || ""}
              alt="Bảng điểm kết quả"
              className="max-w-full h-auto rounded border border-border/40 object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
