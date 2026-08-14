"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  ClipboardList,
  Target,
  Crosshair,
  TrendingUp,
  DollarSign,
  Wallet,
  Gift,
  Receipt,
  PiggyBank,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";

interface DashboardData {
  totalTeams: number;
  activeTeams: number;
  todayTasks: number;
  totalTasks: number;
  completedTaskTeams: number;
  pendingTaskTeams: number;
  totalMatches: number;
  avgWinrate: number;
  totalKills: number;
  revenue: number;
  salary: number;
  bonus: number;
  expense: number;
  profit: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ label, value, subtitle, icon, color = "text-primary" }: StatCardProps) {
  return (
    <Card className="stat-card bg-card/80 border-border/40 hover:border-primary/30 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10 ${color}`}
            style={{ backgroundColor: "currentColor", opacity: 0.1 }}
          >
            <div className={color} style={{ opacity: 1 }}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats({ data }: { data: DashboardData }) {
  const stats: StatCardProps[] = [
    {
      label: "Tổng đội",
      value: data.totalTeams,
      subtitle: `${data.activeTeams} đang hoạt động`,
      icon: <Users className="h-5 w-5" />,
      color: "text-blue-400",
    },
    {
      label: "Nhiệm vụ hôm nay",
      value: data.todayTasks,
      subtitle: `${data.totalTasks} tổng nhiệm vụ`,
      icon: <CalendarCheck className="h-5 w-5" />,
      color: "text-cyan-400",
    },
    {
      label: "Hoàn thành",
      value: data.completedTaskTeams,
      subtitle: `${data.pendingTaskTeams} chưa hoàn thành`,
      icon: <ClipboardList className="h-5 w-5" />,
      color: "text-emerald-400",
    },
    {
      label: "Tổng trận",
      value: data.totalMatches,
      icon: <Target className="h-5 w-5" />,
      color: "text-violet-400",
    },
    {
      label: "Winrate TB",
      value: `${data.avgWinrate}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: data.avgWinrate >= 70 ? "text-emerald-400" : data.avgWinrate >= 50 ? "text-amber-400" : "text-red-400",
    },
    {
      label: "Tổng Kill",
      value: data.totalKills.toLocaleString("vi-VN"),
      icon: <Crosshair className="h-5 w-5" />,
      color: "text-orange-400",
    },
  ];

  const financeStats: StatCardProps[] = [
    {
      label: "Doanh thu tháng",
      value: formatCurrency(data.revenue),
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-emerald-400",
    },
    {
      label: "Lương tháng",
      value: formatCurrency(data.salary),
      icon: <Wallet className="h-5 w-5" />,
      color: "text-blue-400",
    },
    {
      label: "Thưởng tháng",
      value: formatCurrency(data.bonus),
      icon: <Gift className="h-5 w-5" />,
      color: "text-amber-400",
    },
    {
      label: "Chi phí",
      value: formatCurrency(data.expense),
      icon: <Receipt className="h-5 w-5" />,
      color: "text-red-400",
    },
    {
      label: "Lợi nhuận",
      value: formatCurrency(data.profit),
      icon: <PiggyBank className="h-5 w-5" />,
      color: data.profit >= 0 ? "text-emerald-400" : "text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Hiệu suất
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </div>

      {/* Finance Stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Tài chính tháng này
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 stagger-children">
          {financeStats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </div>

      {/* Quick Info */}
      {data.pendingTaskTeams > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                Có {data.pendingTaskTeams} nhiệm vụ chưa hoàn thành
              </p>
              <p className="text-xs text-muted-foreground">
                Kiểm tra mục Tasks để xem chi tiết
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
