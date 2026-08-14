import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Shield } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function AdminActivityLogsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const logs = await prisma.activityLog.findMany({
    include: {
      user: {
        select: { name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Nhật ký Hoạt động (Activity Logs)</h1>
        <p className="text-sm text-muted-foreground">
          Ghi lại toàn bộ hành động nghiệp vụ quan trọng trong hệ thống (Bất biến, không thể sửa đổi)
        </p>
      </div>

      <Card className="border-border/40 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Thời gian</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Chưa có nhật ký hoạt động nào.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {log.user.name} ({log.user.email})
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.user.role === "ADMIN" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {log.user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-sm text-foreground">
                    {log.action}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.details || "—"}
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
