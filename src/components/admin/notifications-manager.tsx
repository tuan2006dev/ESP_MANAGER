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
import { Bell, Send, CheckCheck } from "lucide-react";
import { sendNotification } from "@/actions/notifications";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationsManagerProps {
  notifications: any[];
  teams: any[];
}

export function NotificationsManager({ notifications, teams }: NotificationsManagerProps) {
  const [openSend, setOpenSend] = useState(false);
  const [targetType, setTargetType] = useState<"all" | "team">("all");
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendNotification({
        teamId: targetType === "team" ? teamId : undefined,
        title,
        message,
      });
      toast.success("Đã gửi thông báo thành công!");
      setTitle("");
      setMessage("");
      setOpenSend(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi gửi thông báo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Quản lý Thông báo</h1>
          <p className="text-sm text-muted-foreground">
            Gửi thông báo nhanh đến toàn bộ thành viên hoặc theo từng đội tuyển
          </p>
        </div>

        <Button className="glow-primary" onClick={() => setOpenSend(true)}>
          <Send className="h-4 w-4 mr-1.5" /> Gửi Thông báo mới
        </Button>

        <Dialog open={openSend} onOpenChange={setOpenSend}>
          <DialogContent className="glass border-border/40 sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Gửi Thông báo
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSend} className="space-y-3 pt-2">
              <div>
                <Label>Đối tượng nhận</Label>
                <Select
                  value={targetType}
                  onValueChange={(val: any) => setTargetType(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toàn bộ thành viên tổ chức</SelectItem>
                    <SelectItem value="team">Theo từng đội tuyển</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetType === "team" && (
                <div>
                  <Label>Chọn Đội tuyển</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
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
              )}

              <div>
                <Label htmlFor="n-title">Tiêu đề thông báo</Label>
                <Input
                  id="n-title"
                  placeholder="Ví dụ: Nhắc nhở lịch đấu custom tối nay"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="n-msg">Nội dung chi tiết</Label>
                <Textarea
                  id="n-msg"
                  placeholder="Nội dung thông báo gửi đến các tuyển thủ..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-3">
                {loading ? "Đang gửi..." : "Gửi thông báo ngay"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/40 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người nhận</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Chưa có thông báo nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(n.createdAt)}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {n.user.name} ({n.user.email})
                  </TableCell>
                  <TableCell className="font-bold text-sm text-primary">
                    {n.title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md">
                    {n.message}
                  </TableCell>
                  <TableCell>
                    {n.isRead ? (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                        Đã đọc
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        Chưa đọc
                      </Badge>
                    )}
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
