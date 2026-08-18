"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Key,
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  Coins,
} from "lucide-react";
import { createTask, deleteTask, updateTaskTeamStatus } from "@/actions/tasks";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { TaskStatus } from "@prisma/client";

interface TasksListProps {
  tasks: any[];
  teams: { id: string; name: string }[];
}

export function TasksList({ tasks, teams }: TasksListProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("20:00");
  const [map, setMap] = useState("Đảo Quân Sự");
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [entryFee, setEntryFee] = useState("0");
  const [requirements, setRequirements] = useState(
    "- Tham gia đúng giờ\n- Hoàn thành trận\n- Báo cáo kết quả & gửi ảnh minh chứng"
  );
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(
    teams.map((t) => t.id)
  );
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");

  const filteredTasks = tasks.filter((task) => {
    let matchDate = true;
    let matchTime = true;
    
    if (filterDate) {
      const d = new Date(task.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      matchDate = `${yyyy}-${mm}-${dd}` === filterDate;
    }
    
    if (filterTime) {
      matchTime = task.time === filterTime;
    }
    
    return matchDate && matchTime;
  });

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 đội");
      return;
    }
    setLoading(true);
    try {
      await createTask({
        name,
        description,
        date,
        time,
        map,
        roomId,
        roomPassword,
        requirements,
        entryFee: Number(entryFee) || 0,
        teamIds: selectedTeamIds,
      });
      toast.success("Đã tạo nhiệm vụ và giao cho các đội thành công!");
      setName("");
      setDescription("");
      setRoomId("");
      setRoomPassword("");
      setEntryFee("0");
      setOpenCreate(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo nhiệm vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string, taskName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhiệm vụ "${taskName}"?`)) return;
    try {
      await deleteTask(taskId);
      toast.success("Đã xóa nhiệm vụ!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa nhiệm vụ");
    }
  };

  const handleStatusChange = async (taskTeamId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskTeamStatus(taskTeamId, newStatus);
      toast.success("Đã cập nhật trạng thái nhiệm vụ!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật trạng thái");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-500 text-white">APPROVED (Đã duyệt)</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-500 text-white">COMPLETED (Đã báo cáo)</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-amber-500 text-white">IN_PROGRESS (Đang đấu)</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-cyan-500 text-white">ACCEPTED (Đã nhận)</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500 text-white">REJECTED (Từ chối)</Badge>;
      case "MISSED":
        return <Badge className="bg-zinc-500 text-white">MISSED (Bỏ lỡ)</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">PENDING (Chưa nhận)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Quản lý Nhiệm vụ</h1>
          <p className="text-sm text-muted-foreground">
            Giao nhiệm vụ tham gia custom/giải đấu bên ngoài cho các đội tuyển
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-[150px]"
          />
          <Input
            type="time"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            className="w-[120px]"
          />
          {(filterDate || filterTime) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterDate(""); setFilterTime(""); }} className="px-2">
              Xóa lọc
            </Button>
          )}
          <Button className="glow-primary" onClick={() => setOpenCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Tạo Nhiệm vụ mới
          </Button>
        </div>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="glass border-border/40 sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Tạo Nhiệm vụ & Giao cho Đội
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="task-name">Tên nhiệm vụ / Giải đấu / Custom</Label>
                <Input
                  id="task-name"
                  placeholder="Ví dụ: Custom 8K - Map Đảo Quân Sự"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-date">Ngày thi đấu</Label>
                  <Input
                    id="task-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-time">Thời gian</Label>
                  <Input
                    id="task-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-map">Map thi đấu</Label>
                  <Input
                    id="task-map"
                    placeholder="Đảo Quân Sự / Erangel..."
                    value={map}
                    onChange={(e) => setMap(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-fee">Phí đăng ký / Slot giải (VNĐ)</Label>
                  <Input
                    id="task-fee"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ví dụ: 20000"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value.replace(/[^0-9]/g, ""))}
                    className="font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room-id">Room ID</Label>
                  <Input
                    id="room-id"
                    placeholder="184484976"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-pass">Mật khẩu phòng (Password)</Label>
                  <Input
                    id="room-pass"
                    placeholder="113"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-req">Yêu cầu nhiệm vụ</Label>
                <Textarea
                  id="task-req"
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Nhập các yêu cầu cho đội..."
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-sm font-semibold">
                  Chọn các Đội tuyển được giao nhiệm vụ:
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {teams.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:bg-accent/40 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(t.id)}
                        onChange={() => toggleTeam(t.id)}
                        className="rounded border-border"
                      />
                      <span className="font-semibold">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-4">
                {loading ? "Đang tạo..." : "Xác nhận tạo & Giao nhiệm vụ"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="border-border/40 bg-card/60 p-12 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-semibold">Chưa có nhiệm vụ nào.</p>
            <p className="text-xs mt-1">
              {filterDate ? "Không có nhiệm vụ nào trong ngày này." : "Nhấn nút \"Tạo Nhiệm vụ mới\" để bắt đầu giao task cho các đội."}
            </p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="bg-card/80 border-border/40 hover:border-primary/30 transition-all overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Task details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground">
                        {task.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {task.taskTeams.length} Đội được giao
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {formatDate(task.date)}
                      </span>
                      {task.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-cyan-400" />
                          {task.time}
                        </span>
                      )}
                      {task.map && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-amber-400" />
                          Map: {task.map}
                        </span>
                      )}
                      {task.roomId && (
                        <span className="flex items-center gap-1.5 font-mono bg-accent/40 px-2 py-0.5 rounded">
                          <Key className="h-3 w-3 text-primary" />
                          Room: {task.roomId} | Pass: {task.roomPassword || "Không pass"}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Coins className="h-3 w-3" />
                        Phí slot: {task.entryFee && task.entryFee > 0 ? `${task.entryFee.toLocaleString("vi-VN")} đ` : "0 đ (Miễn phí)"}
                      </span>
                    </div>

                    {task.requirements && (
                      <div className="p-3 rounded-lg bg-accent/20 border border-border/30 text-xs whitespace-pre-line text-muted-foreground">
                        <p className="font-semibold text-foreground mb-1">
                          Yêu cầu:
                        </p>
                        {task.requirements}
                      </div>
                    )}
                  </div>

                  {/* Right delete button */}
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(task.id, task.name)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Xóa nhiệm vụ
                    </Button>
                  </div>
                </div>

                {/* Assigned teams status */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Trạng thái các đội tham gia:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {task.taskTeams.map((tt: any) => (
                      <div
                        key={tt.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/40"
                      >
                        <div>
                          <p className="font-bold text-sm text-foreground">
                            {tt.team.name}
                          </p>
                          <div className="mt-1">{getStatusBadge(tt.status)}</div>
                          {tt.matchResult && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Kết quả:{" "}
                              <span className="text-emerald-400 font-bold">
                                {tt.matchResult.resultType}
                              </span>{" "}
                              • Hạng #{tt.matchResult.rank} • {tt.matchResult.totalKills} Kills
                            </p>
                          )}
                        </div>

                        {/* Admin status override */}
                        <div className="flex flex-col items-end gap-1">
                          <Select
                            value={tt.status}
                            onValueChange={(val) =>
                              handleStatusChange(tt.id, val as TaskStatus)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">PENDING</SelectItem>
                              <SelectItem value="ACCEPTED">ACCEPTED</SelectItem>
                              <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                              <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                              <SelectItem value="APPROVED">APPROVED</SelectItem>
                              <SelectItem value="REJECTED">REJECTED</SelectItem>
                              <SelectItem value="MISSED">MISSED</SelectItem>
                            </SelectContent>
                          </Select>
                          {tt.matchResult && (
                            <Link href="/admin/reports">
                              <Button
                                variant="link"
                                size="sm"
                                className="text-xs h-6 p-0 text-primary"
                              >
                                Xem báo cáo
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
