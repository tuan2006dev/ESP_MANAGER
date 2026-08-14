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
import { AlertTriangle, Plus, Trash2, ShieldAlert } from "lucide-react";
import { createViolation, deleteViolation } from "@/actions/violations";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ViolationsManagerProps {
  violations: any[];
  teams: any[];
}

export function ViolationsManager({ violations, teams }: ViolationsManagerProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"WARNING" | "MINOR" | "MAJOR" | "CRITICAL">("WARNING");
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createViolation({
        teamId,
        description,
        severity,
        proof,
      });
      toast.success("Đã ghi nhận vi phạm và gửi thông báo!");
      setDescription("");
      setProof("");
      setSeverity("WARNING");
      setOpenCreate(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi ghi nhận vi phạm");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa bản ghi vi phạm này?")) return;
    try {
      await deleteViolation(id);
      toast.success("Đã xóa vi phạm!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa");
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <Badge className="bg-red-600 text-white font-bold">CRITICAL (Nghiêm trọng)</Badge>;
      case "MAJOR":
        return <Badge className="bg-orange-500 text-white font-bold">MAJOR (Nặng)</Badge>;
      case "MINOR":
        return <Badge className="bg-amber-500 text-white">MINOR (Nhẹ)</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-400 text-amber-400">WARNING (Cảnh cáo)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Quản lý Vi phạm (Violations)</h1>
          <p className="text-sm text-muted-foreground">
            Ghi nhận và theo dõi lịch sử vi phạm quy định của đội tuyển và thành viên
          </p>
        </div>

        <Button
          variant="destructive"
          className="gap-1.5"
          onClick={() => setOpenCreate(true)}
        >
          <AlertTriangle className="h-4 w-4" /> Ghi nhận Vi phạm
        </Button>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="glass border-border/40 sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" /> Ghi nhận Vi phạm mới
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div>
                <Label htmlFor="v-team">Đội tuyển vi phạm</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger id="v-team" className="w-full">
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
                <Label htmlFor="v-sev">Mức độ vi phạm (Severity)</Label>
                <Select
                  value={severity}
                  onValueChange={(val: any) => setSeverity(val)}
                >
                  <SelectTrigger id="v-sev" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WARNING">WARNING (Cảnh cáo)</SelectItem>
                    <SelectItem value="MINOR">MINOR (Lỗi nhẹ - vào trễ 5p)</SelectItem>
                    <SelectItem value="MAJOR">MAJOR (Lỗi nặng - không tham gia, báo cáo sai)</SelectItem>
                    <SelectItem value="CRITICAL">CRITICAL (Nghiêm trọng - gian lận, bỏ trận)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="v-desc">Mô tả hành vi vi phạm</Label>
                <Textarea
                  id="v-desc"
                  placeholder="Ví dụ: Đội không tham gia trận custom đúng giờ theo lịch BTC đã giao..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="v-proof">Minh chứng / Link ảnh chụp màn hình</Label>
                <Input
                  id="v-proof"
                  placeholder="https://..."
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="destructive"
                className="w-full mt-3"
              >
                {loading ? "Đang lưu..." : "Xác nhận ghi nhận"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/40 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày ghi</TableHead>
              <TableHead>Đội tuyển</TableHead>
              <TableHead>Mức độ</TableHead>
              <TableHead>Mô tả chi tiết</TableHead>
              <TableHead>Minh chứng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {violations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Chưa có bản ghi vi phạm nào.
                </TableCell>
              </TableRow>
            ) : (
              violations.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(v.date)}
                  </TableCell>
                  <TableCell className="font-bold">{v.team.name}</TableCell>
                  <TableCell>{getSeverityBadge(v.severity)}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {v.description}
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(v.id)}
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
