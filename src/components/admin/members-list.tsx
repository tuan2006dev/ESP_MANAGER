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
import { Users, Plus, Trash2, Edit, Crown } from "lucide-react";
import {
  createMemberAndAssign,
  removeTeamMember,
  updateMemberProfile,
  setTeamCaptain,
} from "@/actions/teams";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface MembersListProps {
  members: any[];
  teams: { id: string; name: string }[];
}

export function MembersList({ members, teams }: MembersListProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [gameUid, setGameUid] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Member states
  const [editMember, setEditMember] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editGameUid, setEditGameUid] = useState("");
  const [editTeamId, setEditTeamId] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const handleSetCaptain = async (teamId: string, memberId: string, memberNick: string) => {
    if (!confirm(`Bạn có chắc muốn chỉ định ${memberNick} làm Đội trưởng mới?`)) return;
    try {
      await setTeamCaptain(teamId, memberId);
      toast.success(`Đã bổ nhiệm ${memberNick} làm Đội trưởng!`);
    } catch (err: any) {
      toast.error(err.message || "Lỗi bổ nhiệm đội trưởng");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      toast.error("Vui lòng chọn đội tuyển");
      return;
    }
    setLoading(true);
    try {
      await createMemberAndAssign({
        teamId,
        name,
        email,
        nickname,
        gameUid,
        isCaptain,
      });
      toast.success("Đã thêm thành viên thành công!");
      setName("");
      setEmail("");
      setNickname("");
      setGameUid("");
      setIsCaptain(false);
      setOpenCreate(false);
    } catch (err: any) {
      toast.error(err.message || "Lỗi thêm thành viên");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (m: any) => {
    setEditMember(m);
    setEditName(m.user.name || "");
    setEditNickname(m.nickname || "");
    setEditGameUid(m.gameUid || "");
    setEditTeamId(m.teamId || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setEditLoading(true);
    try {
      await updateMemberProfile({
        memberId: editMember.id,
        name: editName,
        nickname: editNickname,
        gameUid: editGameUid,
        teamId: editTeamId,
      });
      toast.success("Đã cập nhật thông tin thành viên thành công!");
      setEditMember(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật");
    } finally {
      setEditLoading(false);
    }
  };

  const handleRemove = async (memberId: string, memberTeamId: string) => {
    if (!confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await removeTeamMember(memberId, memberTeamId);
      toast.success("Đã xóa thành viên!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa thành viên");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Quản lý Tuyển thủ / Thành viên</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả thành viên trong tổ chức
          </p>
        </div>

        <Button className="glow-primary" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Thêm thành viên
        </Button>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="glass border-border/40 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Thêm tuyển thủ mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 pt-2">
              <div>
                <Label htmlFor="sel-team">Chọn Đội tuyển</Label>
                <Select value={teamId} onValueChange={(val: any) => setTeamId(val || "")}>
                  <SelectTrigger id="sel-team" className="w-full">
                    <SelectValue placeholder="Chọn đội" />
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
                <Label htmlFor="m-name">Họ và tên thật</Label>
                <Input
                  id="m-name"
                  placeholder="Ví dụ: Trần Văn B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="m-email">Tài khoản đăng nhập</Label>
                <Input
                  id="m-email"
                  placeholder="Ví dụ: roxb, egob..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="m-nick">Nickname thi đấu (Tên Game)</Label>
                <Input
                  id="m-nick"
                  placeholder="Ví dụ: ROX_Viper"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="m-uid">Game UID</Label>
                <Input
                  id="m-uid"
                  placeholder="19827364"
                  value={gameUid}
                  onChange={(e) => setGameUid(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isCap"
                  checked={isCaptain}
                  onChange={(e) => setIsCaptain(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="isCap" className="cursor-pointer">
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

      <div className="flex items-center gap-4">
        <Input
          placeholder="Tìm theo tên, nickname hoặc đội..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-card/60"
        />
      </div>

      <Card className="border-border/40 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tuyển thủ</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Đội</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Game UID</TableHead>
              <TableHead>Tổng Kills</TableHead>
              <TableHead>Gia nhập</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  Không tìm thấy thành viên nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((m) => {
                const totalKills = m.playerResults.reduce(
                  (sum: number, r: any) => sum + r.kills,
                  0
                );

                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-bold text-sm text-foreground">{m.nickname}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.user.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {m.user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {m.team.name}
                      </Badge>
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
                    <TableCell className="text-xs font-mono">
                      {m.gameUid || "—"}
                    </TableCell>
                    <TableCell className="font-bold text-amber-400">
                      {totalKills}
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
                            onClick={() => handleSetCaptain(m.teamId, m.id, m.nickname)}
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
                          onClick={() => handleRemove(m.id, m.teamId)}
                          title="Xóa thành viên"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Member Modal for Admin */}
      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent className="glass border-border/40 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Sửa thông tin Tuyển thủ
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3 pt-2">
            <div>
              <Label htmlFor="ed-team">Đội tuyển</Label>
              <Select value={editTeamId} onValueChange={(val: any) => setEditTeamId(val || "")}>
                <SelectTrigger id="ed-team" className="w-full">
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
              <Label htmlFor="ed-real">Họ và tên thật</Label>
              <Input
                id="ed-real"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ed-nick">Tên trong game (Nickname / IGN)</Label>
              <Input
                id="ed-nick"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ed-uid">Game UID</Label>
              <Input
                id="ed-uid"
                value={editGameUid}
                onChange={(e) => setEditGameUid(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={editLoading} className="w-full mt-3 glow-primary">
              {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
