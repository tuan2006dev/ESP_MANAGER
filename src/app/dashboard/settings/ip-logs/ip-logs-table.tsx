"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { banIp, unbanIp } from "@/actions/ip-bans";

type IpLog = {
  id: string;
  ip: string;
  userName: string;
  teamName: string;
  lastSeen: Date;
  isBanned: boolean;
};

export function IpLogsTable({ data }: { data: IpLog[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter(
    (log) =>
      log.ip.includes(searchTerm) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBanToggle = async (ip: string, isBanned: boolean) => {
    try {
      if (isBanned) {
        const res = await unbanIp(ip);
        if (res.error) throw new Error(res.error);
        toast.success(`Đã gỡ khóa cho IP ${ip}`);
      } else {
        const reason = prompt("Nhập lý do khóa (không bắt buộc):");
        if (reason === null) return; // cancelled
        const res = await banIp(ip, reason);
        if (res.error) throw new Error(res.error);
        toast.success(`Đã khóa IP ${ip}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <Input
            placeholder="Tìm kiếm theo IP, tên người dùng hoặc tên đội..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Địa chỉ IP</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Đội</TableHead>
              <TableHead>Truy cập lần cuối</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                  Không tìm thấy dữ liệu.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono">{log.ip}</TableCell>
                  <TableCell className="font-medium">{log.userName}</TableCell>
                  <TableCell>{log.teamName}</TableCell>
                  <TableCell>
                    {format(new Date(log.lastSeen), "HH:mm dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                  <TableCell>
                    {log.isBanned ? (
                      <Badge variant="destructive">Bị Khóa</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                        Bình thường
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={log.isBanned ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => handleBanToggle(log.ip, log.isBanned)}
                    >
                      {log.isBanned ? "Gỡ Khóa" : "Khóa IP"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
